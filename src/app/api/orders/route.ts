import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createRazorpayOrder, RazorpayClientError } from '@/lib/razorpay';
import { enforceRateLimit, RATE_LIMIT_POLICIES } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Rate Limiting (10 checkouts per 15 min per IP)
    const rateLimitResponse = await enforceRateLimit(req, RATE_LIMIT_POLICIES.CHECKOUT);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();
    const { productId, customerEmail, customerName, couponCode } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    // 2. Authoritative product retrieval from DB (NEVER trust client-supplied price)
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isPublished) {
      return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 });
    }

    const subtotalInPaise = product.priceInPaise;
    let discountInPaise = 0;
    let validCouponId: string | null = null;
    let isCouponReserved = false;

    // 3. Authoritative coupon evaluation & atomic reservation
    if (couponCode) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (coupon && coupon.isActive) {
        const isNotExpired = !coupon.expiresAt || coupon.expiresAt.getTime() > Date.now();
        const meetsMinSpend = subtotalInPaise >= coupon.minOrderInPaise;
        const availableSlots = coupon.maxUses === null ? 999999 : coupon.maxUses - (coupon.usedCount + coupon.reservedCount);

        if (isNotExpired && meetsMinSpend && availableSlots > 0) {
          validCouponId = coupon.id;
          if (coupon.discountType === 'PERCENTAGE') {
            discountInPaise = Math.round((subtotalInPaise * coupon.discountValue) / 100);
          } else {
            discountInPaise = Math.min(coupon.discountValue, subtotalInPaise);
          }

          // If limited-use, reserve the slot atomically
          if (coupon.maxUses !== null) {
            const reserved = await prisma.coupon.updateMany({
              where: {
                id: coupon.id,
                isActive: true,
                maxUses: { not: null },
                reservedCount: { lt: coupon.maxUses - coupon.usedCount },
              },
              data: {
                reservedCount: { increment: 1 },
              },
            });

            if (reserved.count > 0) {
              isCouponReserved = true;
            } else {
              // Concurrently exhausted
              discountInPaise = 0;
              validCouponId = null;
            }
          }
        }
      }
    }

    const totalInPaise = Math.max(100, subtotalInPaise - discountInPaise); // Minimum ₹1.00 (100 paise)

    // 4. Upsert customer record
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

    // 5. Generate stable, unique order number (used as stable Razorpay receipt)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GA-${dateStr}-${randSuffix}`;

    // 6. Create database Order in PENDING status (30-minute expiration window)
    const dbOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        status: 'PENDING',
        currency: 'INR',
        subtotalInPaise,
        discountInPaise,
        totalInPaise,
        couponId: validCouponId,
        couponReserved: isCouponReserved,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiration window
        items: {
          create: [
            {
              productId: product.id,
              priceInPaise: product.priceInPaise,
            },
          ],
        },
      },
    });

    // 7. Invoke Razorpay Orders API outside of DB transaction
    let rzpOrder;
    try {
      rzpOrder = await createRazorpayOrder({
        amountInPaise: totalInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          orderId: dbOrder.id,
          productId: product.id,
          productTitle: product.title,
          customerEmail: customer.email,
        },
      });
    } catch (gatewayErr: any) {
      // INVARIANT 1: Classify Razorpay failures carefully
      if (gatewayErr instanceof RazorpayClientError) {
        // Definitive 4xx client error: order definitely NOT created at Razorpay
        if (isCouponReserved && validCouponId) {
          await prisma.coupon.update({
            where: { id: validCouponId },
            data: { reservedCount: { decrement: 1 } },
          }).catch((e) => console.error('[Compensation] Failed to release coupon:', e));
        }

        await prisma.order.update({
          where: { id: dbOrder.id },
          data: { status: 'FAILED', couponReserved: false },
        }).catch((e) => console.error('[Compensation] Failed to mark order failed:', e));

        return NextResponse.json(
          { error: 'Payment request rejected by gateway. Please verify details and try again.' },
          { status: 400 }
        );
      }

      // Timeout / 5xx / Network Hangup: Unknown outcome — Order may exist on Razorpay!
      // DO NOT mark FAILED. Preserve PENDING status and coupon reservation for reconciliation.
      console.warn(`[Orders] Gateway outcome unknown for order ${orderNumber}:`, gatewayErr.message);

      return NextResponse.json(
        {
          success: false,
          pendingReconciliation: true,
          orderId: dbOrder.id,
          orderNumber: dbOrder.orderNumber,
          message: 'Payment gateway request timed out. Order is preserved in pending state for reconciliation.',
        },
        { status: 504 }
      );
    }

    // 8. Link Razorpay Order ID to DB Order
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { razorpayOrderId: rzpOrder.id },
    });

    return NextResponse.json({
      success: true,
      orderId: dbOrder.id,
      orderNumber: dbOrder.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: Math.round(totalInPaise / 100),
      totalInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isMock: Boolean(rzpOrder.isMock),
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
