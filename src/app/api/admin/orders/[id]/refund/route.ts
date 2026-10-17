import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, logAuditEvent } from '@/lib/auth/admin';
import { refundRazorpayPayment } from '@/lib/razorpay';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { amountInPaise, reason, revokeEntitlements: explicitRevoke } = body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        entitlements: true,
        refundRecords: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'PAID' && order.status !== 'PARTIALLY_REFUNDED') {
      return NextResponse.json(
        { error: `Cannot refund order in ${order.status} state` },
        { status: 400 }
      );
    }

    const remainingPaise = order.totalInPaise - order.amountRefundedInPaise;
    if (remainingPaise <= 0) {
      return NextResponse.json({ error: 'Order has already been fully refunded' }, { status: 400 });
    }

    const refundAmount = amountInPaise && amountInPaise > 0
      ? Math.min(amountInPaise, remainingPaise)
      : remainingPaise;

    const isFullRefund = refundAmount >= remainingPaise;
    const shouldRevoke = isFullRefund || explicitRevoke === true;
    const clientIp = getClientIp(req);

    // 1. Execute external Razorpay refund if live payment exists
    let razorpayRefundId = `sim_rfnd_${Date.now()}`;
    if (order.razorpayPaymentId) {
      try {
        const rzpRefund = await refundRazorpayPayment(
          order.razorpayPaymentId,
          refundAmount,
          { orderNumber: order.orderNumber, reason: reason || 'Customer requested refund' }
        );
        razorpayRefundId = rzpRefund.id;
      } catch (rzpErr: any) {
        console.error('Razorpay API refund execution failed:', rzpErr);
        return NextResponse.json(
          { error: `Payment gateway refund failed: ${rzpErr.message}` },
          { status: 502 }
        );
      }
    }

    // 2. Perform atomic database updates inside transaction
    const entitlementIds = order.entitlements.map((e) => e.id);

    await prisma.$transaction(async (tx) => {
      // Record RefundRecord
      await tx.refundRecord.create({
        data: {
          orderId: order.id,
          razorpayRefundId,
          amountInPaise: refundAmount,
          reason: reason || (isFullRefund ? 'Full order refund' : 'Partial order refund'),
          status: 'PROCESSED',
        },
      });

      // Update Order totals and status
      const newRefundedTotal = order.amountRefundedInPaise + refundAmount;
      const newStatus = newRefundedTotal >= order.totalInPaise ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus as any,
          amountRefundedInPaise: newRefundedTotal,
          refundedAt: new Date(),
        },
      });

      // Revoke entitlements & active grants if full refund or explicitly requested
      if (shouldRevoke && entitlementIds.length > 0) {
        await tx.downloadEntitlement.updateMany({
          where: { orderId: order.id },
          data: {
            isRevoked: true,
            revokedReason: reason || (isFullRefund ? 'ORDER_FULL_REFUND' : 'ORDER_PARTIAL_REFUND'),
          },
        });

        // Revoke all unconsumed download grants for these entitlements
        await tx.downloadGrant.updateMany({
          where: {
            entitlementId: { in: entitlementIds },
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        });
      }
    });

    // 3. Record privileged action in AuditLog
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: isFullRefund ? 'ORDER_FULL_REFUND' : 'ORDER_PARTIAL_REFUND',
      targetType: 'ORDER',
      targetId: order.id,
      details: {
        orderNumber: order.orderNumber,
        refundAmount,
        isFullRefund,
        entitlementsRevoked: shouldRevoke,
        razorpayRefundId,
        reason: reason || 'Admin issued refund',
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      refundAmountInPaise: refundAmount,
      isFullRefund,
      entitlementsRevoked: shouldRevoke,
      razorpayRefundId,
      message: `Refund of ₹${(refundAmount / 100).toFixed(2)} processed successfully.`,
    });
  } catch (err: any) {
    console.error('Refund processing error:', err);
    return NextResponse.json({ error: 'Failed to execute refund' }, { status: 500 });
  }
}
