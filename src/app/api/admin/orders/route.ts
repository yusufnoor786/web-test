import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (query) {
      where.OR = [
        { orderNumber: { contains: query } },
        { customer: { email: { contains: query } } },
        { customer: { name: { contains: query } } },
        { razorpayPaymentId: { contains: query } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        entitlements: {
          include: {
            product: true,
            _count: { select: { events: true } },
          },
        },
        refundRecords: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.warn('Database query fallback for admin orders:', err);
    return NextResponse.json({ orders: [] });
  }
}
