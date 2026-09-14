import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { createOrderEntitlements } from '@/lib/downloads';
import { sendOrderReceiptEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
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

    // Idempotency: If already paid, simply return existing entitlements
    if (order.status === 'PAID') {
      const entitlements = await prisma.downloadEntitlement.findMany({
        where: { orderId: order.id, revokedAt: null },
        include: { product: true },
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        orderNumber: order.orderNumber,
        downloadTokens: entitlements.map((e) => ({
          productId: e.productId,
          productTitle: e.product.title,
          downloadUrl: `${siteUrl}/api/download/active/${e.productId}?order=${order.orderNumber}`,
        })),
      });
    }

    // Server-side signature verification
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Mark order as PAID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    // Increment coupon usage if used
    if (order.couponCode) {
      await prisma.coupon
        .update({
          where: { code: order.couponCode },
          data: { usedCount: { increment: 1 } },
        })
        .catch((e) => console.warn('Coupon counter update error:', e));
    }

    // Create cryptographically secure download entitlements
    const issuedTokens = await createOrderEntitlements(order.id);

    // Send transactional email receipt (asynchronous, non-blocking)
    sendOrderReceiptEmail({
      customerName: order.customer.name || '',
      customerEmail: order.customer.email,
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items.map((it) => ({
        title: it.product.title,
        price: it.price,
      })),
      downloadLinks: issuedTokens.map((t) => ({
        title: t.productTitle,
        downloadUrl: t.downloadUrl,
      })),
    }).catch((e) => console.error('Background receipt email error:', e));

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      customerEmail: order.customer.email,
      total: order.total,
      downloadTokens: issuedTokens,
    });
  } catch (error) {
    console.error('Error in /api/payments/verify:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
