import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
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
        { razorpayPaymentId: { contains: query } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
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
      },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error('Error fetching admin orders:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
