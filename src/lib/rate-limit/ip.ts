import { NextRequest } from 'next/server';

/**
 * Normalizes an IPv4 or IPv6 address.
 * IPv6 addresses are truncated to the /64 prefix to prevent rotation bypass within assigned subnets.
 */
export function normalizeIp(rawIp: string | null | undefined): string {
  if (!rawIp) {
    return '127.0.0.1';
  }

  let ip = rawIp.trim().toLowerCase();

  // Strip IPv6-mapped IPv4 prefix (e.g., ::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Handle IPv4
  if (ip.includes('.')) {
    // Basic validation / cleanup
    const parts = ip.split(':');
    return parts[0]; // In case of port attached
  }

  // Handle IPv6: Normalize to /64 subnet
  if (ip.includes(':')) {
    const segments = ip.split(':');
    // Keep first 4 segments (64 bits)
    const subnet64 = segments.slice(0, 4).join(':');
    return `${subnet64}::/64`;
  }

  return ip || '127.0.0.1';
}

/**
 * Safely extracts client IP address from trusted headers (Cloudflare / Vercel / Edge proxy).
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;

  // 1. Cloudflare edge header (most trusted when behind Cloudflare)
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    return normalizeIp(cfIp);
  }

  // 2. Real IP header from reverse proxies (Nginx / Vercel)
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return normalizeIp(realIp);
  }

  // 3. X-Forwarded-For header (take the leftmost untrusted IP or first proxy hop)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((s) => s.trim());
    if (ips.length > 0 && ips[0]) {
      return normalizeIp(ips[0]);
    }
  }

  return '127.0.0.1';
}
