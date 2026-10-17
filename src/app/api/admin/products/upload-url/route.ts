import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getStorageProvider } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();
    const fileName = (body.fileName as string || '').trim();
    const fileType = (body.fileType as string || '').trim();
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : 0;
    const title = (body.title as string || '').trim();

    if (!fileName && !title) {
      return NextResponse.json(
        { error: 'File name or product title is required' },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = path.extname(fileName).toLowerCase();
    if (!ext) {
      ext = fileType === 'application/zip' ? '.zip' : '.pdf';
    }

    // Generate unique slug
    let baseSlug = (title || path.basename(fileName, ext))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'digital-product';

    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Secure, unique storage key
    const uniqueSuffix = Date.now().toString(36);
    const storageKey = `products/${slug}-${uniqueSuffix}${ext}`;

    const sizeInMb = fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(1) : '1.0';
    const computedFormat = ext === '.pdf' ? `PDF · ${sizeInMb} MB` : `ZIP · ${sizeInMb} MB`;
    const fileSizeStr = `${sizeInMb} MB`;
    const contentType =
      fileType ||
      (ext === '.pdf'
        ? 'application/pdf'
        : ext === '.zip'
        ? 'application/zip'
        : 'application/octet-stream');

    const storage = getStorageProvider();
    if (typeof storage.getPresignedUploadUrl === 'function') {
      const uploadUrl = await storage.getPresignedUploadUrl(storageKey, contentType, 3600);
      if (uploadUrl) {
        return NextResponse.json({
          directUpload: true,
          uploadUrl,
          storageKey,
          slug,
          computedFormat,
          fileSize: fileSizeStr,
          contentType,
        });
      }
    }

    // Fallback if cloud storage is not configured (e.g. local dev without credentials)
    return NextResponse.json({
      directUpload: false,
      storageKey,
      slug,
      computedFormat,
      fileSize: fileSizeStr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate upload URL';
    console.error('Error generating presigned upload URL:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
