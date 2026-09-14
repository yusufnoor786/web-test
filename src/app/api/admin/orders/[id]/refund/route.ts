import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedAdmin } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Mark refunded and revoke all entitlements
    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: 'REFUNDED' },
      }),
      prisma.downloadEntitlement.updateMany({
        where: { orderId: id },
        data: { revokedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, message: `Order ${order.orderNumber} marked as refunded and entitlements revoked.` });
  } catch (err) {
    console.error('Refund action error:', err);
    return NextResponse.json({ error: 'Failed to process refund action' }, { status: 500 });
  }
}
