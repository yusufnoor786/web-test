import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { code, orderAmount } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code' }, { status: 400 });
    }

    const subtotalInRupees = Number(orderAmount) || 0;
    const subtotalInPaise = Math.round(subtotalInRupees * 100);
    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Invalid or inactive promotional code' }, { status: 404 });
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ valid: false, message: 'This coupon code has expired' }, { status: 400 });
    }

    const availableSlots = coupon.maxUses === null ? 999999 : coupon.maxUses - (coupon.usedCount + coupon.reservedCount);
    if (availableSlots <= 0) {
      return NextResponse.json({ valid: false, message: 'Coupon usage limit reached' }, { status: 400 });
    }

    if (subtotalInPaise < coupon.minOrderInPaise) {
      const minRequiredRupees = Math.round(coupon.minOrderInPaise / 100);
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order amount of ₹${minRequiredRupees} required for this coupon`,
        },
        { status: 400 }
      );
    }

    let discountInPaise = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountInPaise = Math.round((subtotalInPaise * coupon.discountValue) / 100);
    } else {
      discountInPaise = Math.min(coupon.discountValue, subtotalInPaise);
    }

    const discountAmountRupees = Math.round(discountInPaise / 100);
    const newTotalRupees = Math.max(1, subtotalInRupees - discountAmountRupees);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discountAmountRupees,
      discountInPaise,
      newTotal: newTotalRupees,
      message:
        coupon.discountType === 'PERCENTAGE'
          ? `${coupon.discountValue}% discount applied`
          : `₹${discountAmountRupees} discount applied`,
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    return NextResponse.json({ valid: false, message: 'Failed to validate coupon' }, { status: 500 });
  }
}
