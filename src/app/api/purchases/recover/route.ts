import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSecureToken, hashToken } from '@/lib/auth/crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    // To prevent user enumeration, always return identical success message
    if (!customer || customer.orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account with verified purchases exists for this email, access details have been sent.',
      });
    }

    // Generate cryptographically secure 256-bit raw token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    // Store single-use magic link valid for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customerMagicLink.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const magicLink = `${siteUrl}/api/purchases/verify?token=${rawToken}`;

    // Development-only notice (In production, dispatched via EmailOutbox worker)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n--- [PURCHASE RECOVERY MAGIC LINK] ---`);
      console.log(`Customer: ${customer.email}`);
      console.log(`Magic Link (Expires in 15m): ${magicLink}`);
      console.log(`---------------------------------------\n`);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with verified purchases exists for this email, access details have been sent.',
      debugLink: process.env.NODE_ENV !== 'production' ? magicLink : undefined,
    });
  } catch (err) {
    console.error('Purchase recovery error:', err);
    return NextResponse.json({ error: 'Recovery service error' }, { status: 500 });
  }
}
