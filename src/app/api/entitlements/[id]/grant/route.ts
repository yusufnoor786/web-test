import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { verifyCustomerSession } from '@/lib/auth/customer';
import { hashToken } from '@/lib/auth/crypto';
import { enforceRateLimit, RATE_LIMIT_POLICIES } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // 1. Verify authenticated customer session
    const session = await verifyCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required to request download authorization' }, { status: 401 });
    }

    const { id: entitlementId } = await context.params;

    // 2. Enforce Rate Limiting (10 grant generations per hour per entitlement)
    const rateLimitResponse = await enforceRateLimit(req, RATE_LIMIT_POLICIES.DOWNLOAD_GRANT, `grant:${entitlementId}`);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. Retrieve entitlement and assert customer ownership
    const entitlement = await prisma.downloadEntitlement.findUnique({
      where: { id: entitlementId },
      include: {
        order: true,
        product: true,
      },
    });

    if (!entitlement) {
      return NextResponse.json({ error: 'Entitlement not found' }, { status: 404 });
    }

    if (entitlement.customerId !== session.customerId) {
      return NextResponse.json({ error: 'Access denied: You do not own this digital asset' }, { status: 403 });
    }

    if (entitlement.isRevoked) {
      return NextResponse.json({
        error: `This entitlement has been revoked (${entitlement.revokedReason || 'Order refunded'}).`,
      }, { status: 403 });
    }

    if (entitlement.order.status !== 'PAID') {
      return NextResponse.json({ error: 'Order payment has not been completed.' }, { status: 403 });
    }

    if (entitlement.downloadCount >= entitlement.maxDownloads) {
      return NextResponse.json({
        error: `Download quota exceeded (${entitlement.maxDownloads}/${entitlement.maxDownloads} downloads used).`,
      }, { status: 403 });
    }

    // 4. Generate ephemeral 15-minute single-use DownloadGrant
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    await prisma.downloadGrant.create({
      data: {
        entitlementId: entitlement.id,
        tokenHash,
        expiresAt,
        usedAt: null,
      },
    });

    const downloadUrl = `/api/download/${rawToken}/${entitlement.productId}`;

    const response = NextResponse.json({
      success: true,
      grantToken: rawToken,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      remainingDownloads: entitlement.maxDownloads - entitlement.downloadCount,
    });

    // Set security headers to protect token in browser/proxies
    response.headers.set('Cache-Control', 'no-store, private, max-age=0');
    response.headers.set('Referrer-Policy', 'no-referrer');

    return response;
  } catch (error: any) {
    console.error('Error generating download grant:', error);
    return NextResponse.json({ error: 'Failed to issue download grant' }, { status: 500 });
  }
}
