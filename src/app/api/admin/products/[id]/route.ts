import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, logAuditEvent } from '@/lib/auth/admin';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (typeof body.price === 'number') {
      updateData.priceInPaise = Math.round(body.price * 100);
    } else if (typeof body.priceInPaise === 'number') {
      updateData.priceInPaise = Math.round(body.priceInPaise);
    }

    if (typeof body.compareAtPrice === 'number') {
      updateData.compareAtInPaise = Math.round(body.compareAtPrice * 100);
    } else if (typeof body.compareAtInPaise === 'number') {
      updateData.compareAtInPaise = Math.round(body.compareAtInPaise);
    } else if (body.compareAtPrice === null || body.compareAtInPaise === null) {
      updateData.compareAtInPaise = null;
    }

    if (typeof body.isPublished === 'boolean') updateData.isPublished = body.isPublished;
    if (typeof body.isFeatured === 'boolean') updateData.isFeatured = body.isFeatured;
    if (typeof body.isBestseller === 'boolean') updateData.isBestseller = body.isBestseller;
    if (typeof body.tagline === 'string') updateData.tagline = body.tagline;
    if (typeof body.sortOrder === 'number') updateData.sortOrder = body.sortOrder;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    const clientIp = getClientIp(req);
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: 'PRODUCT_UPDATE',
      targetType: 'PRODUCT',
      targetId: product.id,
      details: { title: product.title, changes: updateData },
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id } = await context.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true, entitlements: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existing._count.orderItems > 0 || existing._count.entitlements > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing purchases. Unpublish it instead.' },
        { status: 400 }
      );
    }

    await prisma.product.delete({ where: { id } });

    const clientIp = getClientIp(req);
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: 'PRODUCT_DELETE',
      targetType: 'PRODUCT',
      targetId: id,
      details: { title: existing.title, slug: existing.slug },
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

