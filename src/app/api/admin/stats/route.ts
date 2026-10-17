import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const totalOrders = await prisma.order.count();
    const paidOrders = await prisma.order.findMany({
      where: { status: 'PAID' },
      select: { totalInPaise: true },
    });

    const totalRevenue = paidOrders.reduce((sum, ord) => sum + Math.round(ord.totalInPaise / 100), 0);
    const totalCustomers = await prisma.customer.count();
    const totalDownloads = await prisma.downloadEvent.count();
    const totalEntitlements = await prisma.downloadEntitlement.count();
    const revokedEntitlements = await prisma.downloadEntitlement.count({ where: { isRevoked: true } });
    const totalCoupons = await prisma.coupon.count();
    const activeCoupons = await prisma.coupon.count({ where: { isActive: true } });

    // Top products by order items
    const items = await prisma.orderItem.findMany({
      where: {
        order: { status: 'PAID' },
      },
      include: {
        product: { select: { id: true, title: true, priceInPaise: true, category: true } },
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
      productSalesMap[it.productId].revenue += Math.round(it.priceInPaise / 100);
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

    // Recent 10 audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        adminUser: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      revenue: totalRevenue,
      totalOrders,
      paidOrderCount: paidOrders.length,
      conversionRate: totalOrders > 0 ? Math.round((paidOrders.length / totalOrders) * 100) : 0,
      totalCustomers,
      totalDownloads,
      totalEntitlements,
      revokedEntitlements,
      totalCoupons,
      activeCoupons,
      topProducts,
      recentOrders,
      recentAuditLogs,
    });
  } catch (err) {
    console.warn('Database query fallback for admin stats:', err);
    return NextResponse.json({
      totalOrders: 0,
      totalRevenue: 0,
      conversionRate: 0,
      totalCustomers: 0,
      totalDownloads: 0,
      totalEntitlements: 0,
      revokedEntitlements: 0,
      totalCoupons: 0,
      activeCoupons: 0,
      topProducts: [],
      recentOrders: [],
      recentAuditLogs: [],
    });
  }
}
