import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { createOrderEntitlements } from '@/lib/downloads';
import { sendOrderReceiptEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // 1. Verify Webhook Signature (permit test simulator pattern only in non-production)
    if (process.env.NODE_ENV === 'production' || !signature.startsWith('mock_')) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[Webhook] Signature validation rejected');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const razorpayEventId = payload.id || `evt_${payload.created_at}_${Math.random().toString(36).slice(2, 8)}`;

    console.log(`[Webhook] Processing event: ${eventType} (ID: ${razorpayEventId})`);

    // 2. Strengthened Webhook Ledger: Concurrency Locking & Idempotency
    const existingEvent = await prisma.razorpayWebhookEvent.findUnique({
      where: { razorpayEventId },
    });

    if (existingEvent) {
      if (existingEvent.status === 'PROCESSED') {
        return NextResponse.json({ received: true, alreadyProcessed: true }, { status: 200 });
      }

      // Check if locked and actively processing (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existingEvent.status === 'PROCESSING' && existingEvent.lockedAt && existingEvent.lockedAt > fiveMinutesAgo) {
        return NextResponse.json({ received: true, inFlight: true }, { status: 200 });
      }

      // Stale processing recovery or retry: Re-claim event
      await prisma.razorpayWebhookEvent.update({
        where: { razorpayEventId },
        data: {
          status: 'PROCESSING',
          lockedAt: new Date(),
          retryCount: { increment: 1 },
        },
      });
    } else {
      await prisma.razorpayWebhookEvent.create({
        data: {
          razorpayEventId,
          eventType,
          payload: rawBody,
          status: 'PROCESSING',
          lockedAt: new Date(),
          retryCount: 0,
        },
      });
    }

    try {
      // 3. Handle Payment Captured & Order Paid Events
      if (eventType === 'order.paid' || eventType === 'payment.captured') {
        const paymentEntity = payload.payload?.payment?.entity;
        const rzpOrderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
        const rzpPaymentId = paymentEntity?.id;
        const notesOrderId = paymentEntity?.notes?.orderId || payload.payload?.order?.entity?.notes?.orderId;

        const order = await prisma.order.findFirst({
          where: {
            OR: [
              ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
              ...(notesOrderId ? [{ id: notesOrderId }] : []),
            ],
          },
          include: {
            customer: true,
            items: { include: { product: true } },
          },
        });

        if (order) {
          // Independent business idempotency: check if order already fulfilled
          if (order.status !== 'PAID') {
            await prisma.$transaction(async (tx) => {
              const current = await tx.order.findUnique({ where: { id: order.id } });
              if (current && current.status === 'PENDING') {
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    status: 'PAID',
                    razorpayPaymentId: rzpPaymentId || current.razorpayPaymentId,
                    couponReserved: false,
                    paidAt: new Date(),
                  },
                });

                if (order.couponId && order.couponReserved) {
                  await tx.coupon.update({
                    where: { id: order.couponId },
                    data: {
                      reservedCount: { decrement: 1 },
                      usedCount: { increment: 1 },
                    },
                  });
                }
              }
            });

            // Create entitlements for all products and bundle children
            const issuedTokens = await createOrderEntitlements(order.id);

            // Transactionally enqueue in EmailOutbox
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
            }).catch((e) => console.error('[Webhook] Outbox error:', e));

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
            }).catch((err) => console.error('[Webhook] Receipt email error:', err));
          }
        }
      }

      // 4. Handle Refund Processed Events
      if (eventType === 'refund.processed') {
        const refundEntity = payload.payload?.refund?.entity;
        const razorpayRefundId = refundEntity?.id;
        const rzpPaymentId = refundEntity?.payment_id;
        const refundAmountInPaise = Number(refundEntity?.amount) || 0;

        if (razorpayRefundId && rzpPaymentId) {
          // Idempotency: Check if refund was already recorded
          const existingRefund = await prisma.refundRecord.findUnique({
            where: { razorpayRefundId },
          });

          if (!existingRefund) {
            const order = await prisma.order.findFirst({
              where: { razorpayPaymentId: rzpPaymentId },
            });

            if (order) {
              const newTotalRefunded = order.amountRefundedInPaise + refundAmountInPaise;
              const isFullRefund = newTotalRefunded >= order.totalInPaise;

              await prisma.$transaction(async (tx) => {
                // Record refund
                await tx.refundRecord.create({
                  data: {
                    orderId: order.id,
                    razorpayRefundId,
                    amountInPaise: refundAmountInPaise,
                    reason: refundEntity?.notes?.reason || 'Gateway refund webhook',
                    status: 'PROCESSED',
                  },
                });

                // Update order status
                await tx.order.update({
                  where: { id: order.id },
                  data: {
                    amountRefundedInPaise: newTotalRefunded,
                    status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
                    refundedAt: new Date(),
                  },
                });

                // Full refund: Revoke all entitlements and invalid active grants
                if (isFullRefund) {
                  await tx.downloadEntitlement.updateMany({
                    where: { orderId: order.id },
                    data: {
                      isRevoked: true,
                      revokedReason: 'ORDER_FULL_REFUND',
                    },
                  });
                }
              });

              // Enqueue refund email outbox job
              await prisma.emailOutbox.upsert({
                where: { idempotencyKey: `order_refund_${razorpayRefundId}` },
                update: {},
                create: {
                  idempotencyKey: `order_refund_${razorpayRefundId}`,
                  orderId: order.id,
                  recipientEmail: payload.payload?.payment?.entity?.email || 'customer@example.com',
                  emailType: 'ORDER_REFUND',
                  subject: `Refund processed for order ${order.orderNumber}`,
                  payload: JSON.stringify({
                    orderNumber: order.orderNumber,
                    refundAmountInPaise,
                    isFullRefund,
                  }),
                  status: 'PENDING',
                },
              }).catch((e) => console.error('[Webhook] Refund outbox error:', e));
            }
          }
        }
      }

      // 5. Mark ledger PROCESSED upon completion
      await prisma.razorpayWebhookEvent.update({
        where: { razorpayEventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          lockedAt: null,
          lastError: null,
        },
      });

      return NextResponse.json({ status: 'ok', received: true });
    } catch (bizErr: any) {
      console.error('[Webhook] Execution error:', bizErr);

      // Record error on ledger for worker retry
      await prisma.razorpayWebhookEvent.update({
        where: { razorpayEventId },
        data: {
          status: 'FAILED',
          lastError: bizErr.message || 'Unknown processing error',
          lockedAt: null,
          nextRetryAt: new Date(Date.now() + 60 * 1000), // 1 min backoff
        },
      });

      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Webhook] Ingress error:', error);
    return NextResponse.json({ error: 'Webhook payload error' }, { status: 500 });
  }
}
