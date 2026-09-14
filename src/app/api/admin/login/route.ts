import { NextRequest, NextResponse } from 'next/server';
import { getAdminCookieHeader } from '@/lib/auth';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'growth_archive_admin_secure_key_2026';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || password.trim() !== ADMIN_SECRET) {
      return NextResponse.json({ error: 'Invalid admin secret key' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: 'Admin authentication successful' });
    response.headers.set('Set-Cookie', getAdminCookieHeader());
    return response;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
