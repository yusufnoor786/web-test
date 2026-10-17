import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAdminSession, logAuditEvent } from '@/lib/auth/admin';
import { enforceRateLimit, RATE_LIMIT_POLICIES, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce rate limiting: 5 attempts / 15 minutes per IP
    const rateLimitResponse = await enforceRateLimit(req, RATE_LIMIT_POLICIES.ADMIN_LOGIN);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 2. Constant-time scrypt password verification against database
    const adminUser = await authenticateAdmin(email, password);

    const clientIp = getClientIp(req);
    const userAgent = req.headers.get('user-agent') || undefined;

    if (!adminUser) {
      await logAuditEvent({
        action: 'ADMIN_LOGIN_FAILED',
        targetType: 'ADMIN_USER',
        targetId: email.trim().toLowerCase(),
        details: { reason: 'Invalid credentials or inactive account' },
        ipAddress: clientIp,
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. Create persistent 24-hour AdminSession & Double-submit CSRF cookie
    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });

    const { csrfToken } = await createAdminSession(adminUser.id, response, {
      ipAddress: clientIp,
      userAgent,
    });

    // Provide csrfToken in payload for immediate client header attachment
    const responseWithCsrf = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
      csrfToken,
    });

    // Copy cookies to new response
    for (const cookie of response.cookies.getAll()) {
      responseWithCsrf.cookies.set(cookie);
    }

    // 4. Record successful login in audit log
    await logAuditEvent({
      adminUserId: adminUser.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      targetType: 'ADMIN_USER',
      targetId: adminUser.id,
      details: { email: adminUser.email, role: adminUser.role },
      ipAddress: clientIp,
    });

    return responseWithCsrf;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
