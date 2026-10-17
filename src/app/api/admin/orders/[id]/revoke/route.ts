import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, logAuditEvent } from '@/lib/auth/admin';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, _context: RouteContext) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { entitlementId, reason } = await req.json();

    if (!entitlementId) {
      return NextResponse.json({ error: 'Missing entitlementId' }, { status: 400 });
    }

    const entitlement = await prisma.downloadEntitlement.findUnique({
      where: { id: entitlementId },
      include: { product: true, order: true },
    });

    if (!entitlement) {
      return NextResponse.json({ error: 'Entitlement not found' }, { status: 404 });
    }

    // Revoke entitlement and invalidate any active download grants
    await prisma.$transaction([
      prisma.downloadEntitlement.update({
        where: { id: entitlementId },
        data: {
          isRevoked: true,
          revokedReason: reason || 'MANUAL_ADMIN_REVOCATION',
        },
      }),
      prisma.downloadGrant.updateMany({
        where: { entitlementId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    const clientIp = getClientIp(req);
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: 'ENTITLEMENT_REVOKE',
      targetType: 'ENTITLEMENT',
      targetId: entitlementId,
      details: {
        productTitle: entitlement.product.title,
        orderNumber: entitlement.order.orderNumber,
        reason: reason || 'MANUAL_ADMIN_REVOCATION',
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `Access revoked for ${entitlement.product.title}`,
      entitlementId,
    });
  } catch (err) {
    console.error('Revoke entitlement error:', err);
    return NextResponse.json({ error: 'Failed to revoke entitlement' }, { status: 500 });
  }
}
