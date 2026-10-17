import { NextRequest, NextResponse } from 'next/server';
import { revokeCustomerSession } from '@/lib/auth/customer';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  await revokeCustomerSession(req, response);
  return response;
}
