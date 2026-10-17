import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchRazorpayOrderByReceipt } from '@/lib/razorpay';
import { createOrderEntitlements } from '@/lib/downloads';
import { sendOrderReceiptEmail } from '@/lib/email';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If order is already in a terminal state, return current status immediately
    if (order.status === 'PAID' || order.status === 'REFUNDED' || order.status === 'CANCELLED' || order.status === 'EXPIRED') {
      return NextResponse.json({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalInPaise: order.totalInPaise,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
      });
    }

    // Order is currently PENDING: Attempt reconciliation against Razorpay
    if (order.status === 'PENDING') {
      const rzpMatch = await fetchRazorpayOrderByReceipt(order.orderNumber);

      if (rzpMatch) {
        // Gateway has the order! Link razorpayOrderId if missing
        if (!order.razorpayOrderId) {
          await prisma.order.update({
            where: { id: order.id },
            data: { razorpayOrderId: rzpMatch.id },
          });
        }

        // If Razorpay indicates order was paid, execute atomic fulfillment
        if (rzpMatch.status === 'paid') {
          const updated = await prisma.$transaction(async (tx) => {
            const current = await tx.order.findUnique({ where: { id: order.id } });
            if (!current || current.status === 'PAID') {
              return current;
            }

            // Mark order PAID
            const transitioned = await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'PAID',
                couponReserved: false,
                paidAt: new Date(),
              },
            });

            // Convert coupon reservation
            if (order.couponId && order.couponReserved) {
              await tx.coupon.update({
                where: { id: order.couponId },
                data: {
                  reservedCount: { decrement: 1 },
                  usedCount: { increment: 1 },
                },
              });
            }

            return transitioned;
          });

          if (updated && updated.status === 'PAID') {
            const issuedTokens = await createOrderEntitlements(order.id);
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
            }).catch((e) => console.error('[Reconciliation] Receipt email error:', e));

            return NextResponse.json({
              id: order.id,
              orderNumber: order.orderNumber,
              status: 'PAID',
              totalInPaise: order.totalInPaise,
              paidAt: updated.paidAt,
              reconciled: true,
            });
          }
        }
      }

      // Check if order window has expired (> 30 minutes) and Razorpay definitely has no payment
      if (order.expiresAt && order.expiresAt.getTime() < Date.now()) {
        // Safe reaper transition: release coupon reservation and mark EXPIRED
        await prisma.$transaction(async (tx) => {
          const current = await tx.order.findUnique({ where: { id: order.id } });
          if (current && current.status === 'PENDING') {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'EXPIRED',
                couponReserved: false,
              },
            });

            if (order.couponId && order.couponReserved) {
              await tx.coupon.update({
                where: { id: order.couponId },
                data: {
                  reservedCount: { decrement: 1 },
                },
              });
            }
          }
        });

        return NextResponse.json({
          id: order.id,
          orderNumber: order.orderNumber,
          status: 'EXPIRED',
          message: 'Order window expired without completed payment.',
        });
      }
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalInPaise: order.totalInPaise,
      expiresAt: order.expiresAt,
    });
  } catch (err: any) {
    console.error('Order status lookup error:', err);
    return NextResponse.json({ error: 'Failed to retrieve order status' }, { status: 500 });
  }
}
