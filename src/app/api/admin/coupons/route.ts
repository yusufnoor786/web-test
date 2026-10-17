import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, logAuditEvent } from '@/lib/auth/admin';
import { getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error('Error fetching coupons:', err);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Code, discount type, and value are required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check for existing coupon code
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json({ error: `Coupon code '${cleanCode}' already exists.` }, { status: 409 });
    }

    const created = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        discountValue: Number(discountValue),
        minOrderInPaise: minOrderAmount ? Math.round(Number(minOrderAmount) * 100) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        usedCount: 0,
        reservedCount: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    const clientIp = getClientIp(req);
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: 'COUPON_CREATE',
      targetType: 'COUPON',
      targetId: created.id,
      details: {
        code: cleanCode,
        discountType: created.discountType,
        discountValue: created.discountValue,
        maxUses: created.maxUses,
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, coupon: created });
  } catch (err) {
    console.error('Create coupon error:', err);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const { id, isActive, maxUses } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (maxUses !== undefined) updateData.maxUses = maxUses ? Number(maxUses) : null;

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    const clientIp = getClientIp(req);
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: 'COUPON_UPDATE',
      targetType: 'COUPON',
      targetId: updated.id,
      details: { code: updated.code, changes: updateData },
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err) {
    console.error('Update coupon error:', err);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}
