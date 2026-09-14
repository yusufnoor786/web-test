import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

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

    // To prevent user enumeration, always return success message even if email not found
    if (!customer || customer.orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'If an account with verified purchases exists for this email, access details have been sent.',
      });
    }

    // Generate 6-digit recovery OTP and magic token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const magicSecret = crypto.randomBytes(24).toString('hex');
    const combinedToken = `${otp}:${magicSecret}`;
    const tokenHash = crypto.createHash('sha256').update(combinedToken).digest('hex');

    // Store token valid for 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.purchaseRecoveryToken.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const magicLink = `${siteUrl}/purchases?email=${encodeURIComponent(cleanEmail)}&token=${combinedToken}`;

    // Log recovery details cleanly for local verification
    console.log(`\n--- [PURCHASE RECOVERY OTP DISPATCH] ---`);
    console.log(`Customer: ${customer.email}`);
    console.log(`Recovery Code (OTP): ${otp}`);
    console.log(`Recovery Token: ${combinedToken}`);
    console.log(`Magic Direct Link: ${magicLink}`);
    console.log(`---------------------------------------\n`);

    return NextResponse.json({
      success: true,
      message: 'If an account with verified purchases exists for this email, access details have been sent.',
      debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('Purchase recovery error:', err);
    return NextResponse.json({ error: 'Recovery service error' }, { status: 500 });
  }
}
