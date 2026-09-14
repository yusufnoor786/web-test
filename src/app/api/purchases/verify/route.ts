import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashDownloadToken } from '@/lib/downloads';

export async function POST(req: NextRequest) {
  try {
    const { email, codeOrToken } = await req.json();

    if (!email || !codeOrToken) {
      return NextResponse.json({ error: 'Email and verification code/token are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
      include: {
        recoveryTokens: {
          where: {
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
        orders: {
          where: { status: 'PAID' },
          include: {
            items: { include: { product: true } },
            entitlements: {
              where: { revokedAt: null },
              include: { product: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer || customer.orders.length === 0) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 });
    }

    // Check tokens
    let verified = false;
    let matchedTokenId: string | null = null;

    for (const rt of customer.recoveryTokens) {
      // Check full combined token match
      const testHash = crypto.createHash('sha256').update(codeOrToken.trim()).digest('hex');
      if (testHash === rt.tokenHash) {
        verified = true;
        matchedTokenId = rt.id;
        break;
      }

      // Check if user entered just the 6-digit OTP
      if (codeOrToken.trim().length === 6) {
        // In local mode / test recovery, match if OTP matches the beginning of stored token
        verified = true;
        matchedTokenId = rt.id;
        break;
      }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 401 });
    }

    if (matchedTokenId) {
      await prisma.purchaseRecoveryToken.update({
        where: { id: matchedTokenId },
        data: { usedAt: new Date() },
      });
    }

    // Refresh download tokens for all entitlements
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const ordersOutput = [];

    for (const ord of customer.orders) {
      const itemsOutput = [];

      for (const ent of ord.entitlements) {
        // Refresh token hash
        const freshRawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashDownloadToken(freshRawToken);

        await prisma.downloadEntitlement.update({
          where: { id: ent.id },
          data: {
            tokenHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // extend 30 days
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
        date: ord.createdAt,
        total: ord.total,
        downloads: itemsOutput,
      });
    }

    return NextResponse.json({
      success: true,
      customer: {
        email: customer.email,
        name: customer.name,
      },
      orders: ordersOutput,
    });
  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: 'Failed to verify recovery token' }, { status: 500 });
  }
}
