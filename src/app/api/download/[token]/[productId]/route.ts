import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import { validateAndAuthorizeDownload } from '@/lib/downloads';

interface RouteContext {
  params: Promise<{
    token: string;
    productId: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { token, productId } = await context.params;

    if (!token || !productId) {
      return new NextResponse('Bad Request: Missing token or product ID', { status: 400 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const authResult = await validateAndAuthorizeDownload(token, productId, {
      ipAddress,
      userAgent,
    });

    const fileStream = fs.createReadStream(authResult.fileInfo.fullPath);

    // Convert node ReadStream to web ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': authResult.fileInfo.mimeType,
        'Content-Length': authResult.fileInfo.sizeBytes.toString(),
        'Content-Disposition': `attachment; filename="${authResult.fileInfo.fileName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download failed';
    console.error('Download authorization error:', message);

    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>Download Access Error</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #FBF9F5; color: #121417; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 80vh;">
  <div style="max-width: 480px; background: #FFF; padding: 32px; border: 1px solid #E5E2DA; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <h2 style="margin-top:0; color: #B91C1C; font-size: 20px;">Download Access Denied</h2>
    <p style="color: #575D65; line-height: 1.6; font-size: 14px;">${message}</p>
    <hr style="border: 0; border-top: 1px solid #E5E2DA; margin: 24px 0;" />
    <p style="font-size: 13px; color: #71767E;">Need assistance? Access your account via <a href="/purchases" style="color: #121417; text-decoration: underline;">My Purchases</a> or contact support.</p>
    <a href="/" style="display: inline-block; margin-top: 12px; background: #121417; color: #FFF; padding: 10px 18px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">← Return to Store</a>
  </div>
</body>
</html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
