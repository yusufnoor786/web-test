import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
  }

  try {
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      select: { total: true },
    });

    const totalRevenue = paidOrders.reduce((sum, ord) => sum + ord.total, 0);
    const totalCustomers = await prisma.customer.count();
    const totalDownloads = await prisma.downloadEvent.count();

    // Top products by order items
    const items = await prisma.orderItem.findMany({
      where: {
        order: { status: 'PAID' },
      },
      include: {
        product: { select: { id: true, title: true, price: true, category: true } },
      },
    });

    const productSalesMap: { [id: string]: { title: string; category: string; count: number; revenue: number } } = {};
    for (const it of items) {
      if (!productSalesMap[it.productId]) {
        productSalesMap[it.productId] = {
          title: it.product.title,
          category: it.product.category,
          count: 0,
          revenue: 0,
        };
      }
      productSalesMap[it.productId].count += 1;
      productSalesMap[it.productId].revenue += it.price;
    }

    const topProducts = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

    // Recent 5 orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { email: true, name: true } },
        items: { include: { product: { select: { title: true } } } },
      },
    });

    return NextResponse.json({
      revenue: totalRevenue,
      totalOrders,
      paidOrderCount: paidOrders.length,
      conversionRate: totalOrders > 0 ? Math.round((paidOrders.length / totalOrders) * 100) : 0,
      totalCustomers,
      totalDownloads,
      topProducts,
      recentOrders,
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
