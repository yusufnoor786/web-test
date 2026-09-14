import { NextRequest } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'growth_archive_admin_secure_key_2026';

export function isAuthorizedAdmin(req: NextRequest): boolean {
  // Check header Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token === ADMIN_SECRET) return true;
  }

  // Check custom header x-admin-key
  const customHeader = req.headers.get('x-admin-key');
  if (customHeader && customHeader.trim() === ADMIN_SECRET) return true;

  // Check cookie admin_session
  const cookie = req.cookies.get('admin_session');
  if (cookie && cookie.value === ADMIN_SECRET) return true;

  return false;
}

export function getAdminCookieHeader(): string {
  return `admin_session=${ADMIN_SECRET}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}
