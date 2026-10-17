import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashDownloadToken } from '@/lib/downloads';
import { hashToken } from '@/lib/auth/crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, codeOrToken } = await req.json();

    if (!email || !codeOrToken) {
      return NextResponse.json({ error: 'Email and verification code/token are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tokenHash = hashToken(codeOrToken.trim());

    // Atomically find customer and valid unused magic link
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
      include: {
        magicLinks: {
          where: {
            tokenHash,
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
        orders: {
          where: { status: 'PAID' },
          include: {
            items: { include: { product: true } },
            entitlements: {
              where: { isRevoked: false },
              include: { product: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer || customer.magicLinks.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired recovery link' }, { status: 401 });
    }

    const matchedMagicLink = customer.magicLinks[0];

    // Atomically consume the single-use magic link
    await prisma.customerMagicLink.update({
      where: { id: matchedMagicLink.id },
      data: { usedAt: new Date() },
    });

    // Establish a fresh 2-hour customer session
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionHash = hashToken(rawSessionToken);
    const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        sessionHash,
        expiresAt: sessionExpiresAt,
      },
    });

    // Refresh download grants for all entitlements
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const ordersOutput = [];

    for (const ord of customer.orders) {
      const itemsOutput = [];

      for (const ent of ord.entitlements) {
        // Issue an ephemeral 15-minute single-use DownloadGrant
        const freshRawToken = crypto.randomBytes(32).toString('hex');
        const grantTokenHash = hashDownloadToken(freshRawToken);

        await prisma.downloadGrant.create({
          data: {
            entitlementId: ent.id,
            tokenHash: grantTokenHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
        });

        itemsOutput.push({
          id: ent.id,
          productId: ent.productId,
          title: ent.product.title,
          category: ent.product.category,
          format: ent.product.format,
          downloadCount: ent.downloadCount,
          maxDownloads: ent.maxDownloads,
          downloadUrl: `${siteUrl}/api/download/${freshRawToken}/${ent.productId}`,
        });
      }

      ordersOutput.push({
        id: ord.id,
        orderNumber: ord.orderNumber,
        createdAt: ord.createdAt,
        total: Math.round(ord.totalInPaise / 100),
        status: ord.status,
        items: itemsOutput,
      });
    }

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
      orders: ordersOutput,
    });

    // Set HttpOnly, Secure customer session cookie
    response.cookies.set('ga_customer_session', rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7200,
    });

    // Set security headers to protect token in browser/proxies
    response.headers.set('Cache-Control', 'no-store, private, max-age=0');
    response.headers.set('Referrer-Policy', 'no-referrer');

    return response;
  } catch (err) {
    console.error('Verify recovery token error:', err);
    return NextResponse.json({ error: 'Verification service error' }, { status: 500 });
  }
}
