import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthorizedAdmin } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.price === 'number') updateData.price = body.price;
    if (typeof body.compareAtPrice === 'number' || body.compareAtPrice === null) updateData.compareAtPrice = body.compareAtPrice;
    if (typeof body.isPublished === 'boolean') updateData.isPublished = body.isPublished;
    if (typeof body.isFeatured === 'boolean') updateData.isFeatured = body.isFeatured;
    if (typeof body.isBestseller === 'boolean') updateData.isBestseller = body.isBestseller;
    if (typeof body.tagline === 'string') updateData.tagline = body.tagline;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
