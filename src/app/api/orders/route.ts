import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, customerEmail, customerName, couponCode } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    // Authoritative product retrieval from DB (NEVER trust client price)
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 });
    }

    const subtotal = product.price;
    let discount = 0;
    let validCouponCode: string | null = null;

    // Authoritative coupon evaluation
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.isActive) {
        const isNotExpired = !coupon.expiresAt || coupon.expiresAt.getTime() > Date.now();
        const meetsMinSpend = subtotal >= coupon.minOrderAmount;
        const withinUsageLimit = !coupon.maxUses || coupon.usedCount < coupon.maxUses;

        if (isNotExpired && meetsMinSpend && withinUsageLimit) {
          validCouponCode = coupon.code;
          if (coupon.discountType === 'PERCENTAGE') {
            discount = Math.round((subtotal * coupon.discountValue) / 100);
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }

    const total = Math.max(1, subtotal - discount); // Minimum 1 INR for payment gateway

    // Upsert customer record
    const customer = await prisma.customer.upsert({
      where: { email: customerEmail.trim().toLowerCase() },
      update: {
        name: customerName?.trim() || undefined,
      },
      create: {
        email: customerEmail.trim().toLowerCase(),
        name: customerName?.trim() || null,
      },
    });

    // Generate unique human-readable order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GA-${dateStr}-${randSuffix}`;

    // Create database Order
    const dbOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: 'PENDING',
        currency: 'INR',
        subtotal,
        discount,
        total,
        couponCode: validCouponCode,
        items: {
          create: [
            {
              productId: product.id,
              price: product.price,
            },
          ],
        },
      },
    });

    // Create Razorpay Order server-side
    const rzpOrder = await createRazorpayOrder({
      amount: total,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderId: dbOrder.id,
        productId: product.id,
        productTitle: product.title,
        customerEmail: customer.email,
      },
    });

    // Link Razorpay Order ID
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      success: true,
      orderId: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isMock: rzpOrder.isMock,
      customerEmail: customer.email,
      customerName: customer.name,
      productTitle: product.title,
    });
  } catch (error) {
    console.error('Error in /api/orders:', error);
    return NextResponse.json({ error: 'Failed to initiate order. Please try again.' }, { status: 500 });
  }
}
