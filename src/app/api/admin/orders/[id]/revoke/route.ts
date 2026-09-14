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
    const { entitlementId } = await req.json();

    if (!entitlementId) {
      return NextResponse.json({ error: 'Missing entitlementId' }, { status: 400 });
    }

    const updated = await prisma.downloadEntitlement.update({
      where: { id: entitlementId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ success: true, entitlement: updated });
  } catch (err) {
    console.error('Revoke entitlement error:', err);
    return NextResponse.json({ error: 'Failed to revoke entitlement' }, { status: 500 });
  }
}
