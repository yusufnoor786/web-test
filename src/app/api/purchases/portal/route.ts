import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCustomerSession } from '@/lib/auth/customer';

export async function GET(req: NextRequest) {
  try {
    const session = await verifyCustomerSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Please log in or request a magic recovery link' }, { status: 401 });
    }

    const entitlements = await prisma.downloadEntitlement.findMany({
      where: {
        customerId: session.customerId,
        order: { status: 'PAID' },
      },
      include: {
        product: true,
        order: {
          select: {
            orderNumber: true,
            paidAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      customer: {
        id: session.customerId,
        email: session.customerEmail,
        name: session.customerName,
      },
      items: entitlements.map((ent) => ({
        entitlementId: ent.id,
        productId: ent.productId,
        title: ent.product.title,
        tagline: ent.product.tagline,
        category: ent.product.category,
        format: ent.product.format,
        fileSize: ent.product.fileSize,
        downloadCount: ent.downloadCount,
        maxDownloads: ent.maxDownloads,
        isRevoked: ent.isRevoked,
        revokedReason: ent.revokedReason,
        orderNumber: ent.order.orderNumber,
        purchasedAt: ent.order.paidAt || ent.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Customer portal fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve purchases' }, { status: 500 });
  }
}
