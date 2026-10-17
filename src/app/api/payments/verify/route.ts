import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createOrderEntitlements } from '@/lib/downloads';
import { sendOrderReceiptEmail } from '@/lib/email';
import { hashToken } from '@/lib/auth/crypto';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit (20 attempts per 15 min per IP)
    const rateLimitResponse = await enforceRateLimit(req, {
      prefix: 'verify_ip',
      maxRequests: 20,
      windowSeconds: 15 * 60,
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required payment verification payload' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order record not found' }, { status: 404 });
    }

    // Idempotency: If already paid, acknowledge without re-fulfilling
    if (order.status === 'PAID') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        orderNumber: order.orderNumber,
        accessGranted: true,
      });
    }

    // Server-side HMAC-SHA256 signature verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Atomic fulfillment transition
    await prisma.$transaction(async (tx) => {
      // 1. Mark order as PAID
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          razorpaySignature,
          couponReserved: false,
          paidAt: new Date(),
        },
      });

      // 2. Convert coupon reservation to usedCount if a coupon was reserved
      if (order.couponId && order.couponReserved) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: {
            reservedCount: { decrement: 1 },
            usedCount: { increment: 1 },
          },
        });
      }
    });

    // Create cryptographically secure download entitlements for all products and bundle items
    const issuedTokens = await createOrderEntitlements(order.id);

    // Enqueue in EmailOutbox for resilient, idempotent delivery
    await prisma.emailOutbox.upsert({
      where: { idempotencyKey: `order_fulfillment_${order.id}` },
      update: {},
      create: {
        idempotencyKey: `order_fulfillment_${order.id}`,
        orderId: order.id,
        recipientEmail: order.customer.email,
        emailType: 'ORDER_CONFIRMATION',
        subject: `Your order confirmation: ${order.orderNumber}`,
        payload: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customer.name,
          totalInPaise: order.totalInPaise,
        }),
        status: 'PENDING',
      },
    }).catch((e) => console.error('[EmailOutbox] Failed to enqueue order receipt:', e));

    // Opportunistic inline receipt dispatch (non-blocking)
    sendOrderReceiptEmail({
      customerName: order.customer.name || '',
      customerEmail: order.customer.email,
      orderNumber: order.orderNumber,
      total: Math.round(order.totalInPaise / 100),
      items: order.items.map((it) => ({
        title: it.product.title,
        price: Math.round(it.priceInPaise / 100),
      })),
      downloadLinks: issuedTokens.map((t) => ({
        title: t.productTitle,
        downloadUrl: t.downloadUrl,
      })),
    }).catch((e) => console.error('Background receipt email error:', e));

    // Establish customer portal session
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionHash = hashToken(rawSessionToken);
    const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await prisma.customerSession.create({
      data: {
        customerId: order.customerId,
        sessionHash,
        expiresAt: sessionExpiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      accessGranted: true,
    });

    // Set HttpOnly, Secure, SameSite=Lax customer session cookie
    response.cookies.set('ga_customer_session', rawSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7200, // 2 hours
    });

    return response;
  } catch (error) {
    console.error('Error in /api/payments/verify:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
