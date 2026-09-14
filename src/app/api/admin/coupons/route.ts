import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = await req.json();

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: 'Code, discount type, and value are required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const created = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, coupon: created });
  } catch (err) {
    console.error('Create coupon error:', err);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
