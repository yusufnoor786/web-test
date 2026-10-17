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
    const query = searchParams.get('q');
    const isRevoked = searchParams.get('revoked');

    const where: Record<string, unknown> = {};
    if (isRevoked === 'true') where.isRevoked = true;
    if (isRevoked === 'false') where.isRevoked = false;

    if (query) {
      where.OR = [
        { customer: { email: { contains: query } } },
        { product: { title: { contains: query } } },
        { order: { orderNumber: { contains: query } } },
      ];
    }

    const entitlements = await prisma.downloadEntitlement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        product: { select: { id: true, title: true, format: true } },
        customer: { select: { id: true, email: true, name: true } },
        order: { select: { id: true, orderNumber: true, status: true, paidAt: true } },
        _count: { select: { events: true, grants: true } },
      },
    });

    return NextResponse.json({ entitlements });
  } catch (err) {
    console.warn('Database query fallback for entitlements:', err);
    return NextResponse.json({ entitlements: [] });
  }
}
