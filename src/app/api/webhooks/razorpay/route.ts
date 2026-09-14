import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { createOrderEntitlements } from '@/lib/downloads';
import { sendOrderReceiptEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature (or permit test simulator)
    if (process.env.NODE_ENV === 'production' || !signature.startsWith('mock_')) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('Webhook signature validation rejected');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`Received Razorpay webhook event: ${event}`);

    // Handle payment.captured or order.paid events
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const rzpPaymentId = paymentEntity?.id;

      if (!rzpOrderId) {
        return NextResponse.json({ message: 'No order_id in webhook payload' }, { status: 200 });
      }

      const order = await prisma.order.findFirst({
        where: { razorpayOrderId: rzpOrderId },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        console.warn(`Order not found for razorpayOrderId: ${rzpOrderId}`);
        return NextResponse.json({ message: 'Order not found in store' }, { status: 200 });
      }

      // Idempotency: If already marked PAID, don't re-fulfill
      if (order.status === 'PAID') {
        return NextResponse.json({ message: 'Order already fulfilled' }, { status: 200 });
      }

      // Mark order as PAID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          razorpayPaymentId: rzpPaymentId || order.razorpayPaymentId,
        },
      });

      // Create download entitlements
      const issuedTokens = await createOrderEntitlements(order.id);

      // Dispatch receipt email
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
      }).catch((err) => console.error('Webhook receipt email error:', err));
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
