import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/admin';
import { CSRF_COOKIE_NAME, generateCsrfToken, setCsrfCookie } from '@/lib/auth/csrf';

export async function GET(req: NextRequest) {
  try {
    const session = await verifyAdminSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let csrfToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    const response = NextResponse.json({
      authenticated: true,
      admin: {
        id: session.adminUserId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
      csrfToken: csrfToken || undefined,
    });

    if (!csrfToken) {
      csrfToken = generateCsrfToken();
      setCsrfCookie(response, csrfToken);
      // Update body
      return NextResponse.json({
        authenticated: true,
        admin: {
          id: session.adminUserId,
          email: session.email,
          name: session.name,
          role: session.role,
        },
        csrfToken,
      }, { headers: response.headers });
    }

    return response;
  } catch (err) {
    console.error('Admin session check error:', err);
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 });
  }
}
