import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession, revokeAdminSession, logAuditEvent } from '@/lib/auth/admin';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    const clientIp = getClientIp(req);

    const response = NextResponse.json({ success: true, message: 'Admin logged out' });
    await revokeAdminSession(req, response);

    if (session) {
      await logAuditEvent({
        adminUserId: session.adminUserId,
        action: 'ADMIN_LOGOUT',
        targetType: 'ADMIN_USER',
        targetId: session.adminUserId,
        details: { email: session.email },
        ipAddress: clientIp,
      });
    }

    return response;
  } catch (err) {
    console.error('Admin logout error:', err);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
