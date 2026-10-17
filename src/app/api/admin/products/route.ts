import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, logAuditEvent } from '@/lib/auth/admin';
import { getClientIp } from '@/lib/rate-limit';
import { getStorageProvider } from '@/lib/storage';

import { ALL_DEFAULT_ITEMS } from '@/lib/catalog/default-products';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orderItems: true, entitlements: true },
        },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({
        products: ALL_DEFAULT_ITEMS.map((p) => ({
          ...p,
          _count: { orderItems: 0, entitlements: 0 },
        })),
      });
    }

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Database query fallback for admin products:', err);
    return NextResponse.json({
      products: ALL_DEFAULT_ITEMS.map((p) => ({
        ...p,
        _count: { orderItems: 0, entitlements: 0 },
      })),
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const contentTypeHeader = req.headers.get('content-type') || '';
    const isJson = contentTypeHeader.includes('application/json');

    let title = '';
    let categoryRaw = 'PLAYBOOK';
    let tagline = '';
    let description = '';
    let priceStr = '0';
    let compareAtStr: string | null = null;
    let formatInput = '';
    let level = 'All Levels';
    let isPublished = false;
    let isFeatured = false;
    let isBestseller = false;

    let storageKey = '';
    let fileSize = '';
    let computedFormat = '';
    let checksumSha256 = '';
    let slug = '';

    const validCategories = ['NOTE', 'GUIDE', 'PLAYBOOK', 'TEMPLATE', 'CASE_STUDY', 'BUNDLE'];

    if (isJson) {
      // 1A. Direct upload mode (file was uploaded directly to Cloudflare R2 via presigned URL)
      const body = await req.json();
      title = (body.title as string || '').trim();
      categoryRaw = (body.category as string || 'PLAYBOOK').trim().toUpperCase();
      tagline = (body.tagline as string || '').trim();
      description = (body.description as string || '').trim();
      priceStr = String(body.price ?? '0');
      compareAtStr = body.compareAtPrice ? String(body.compareAtPrice) : null;
      formatInput = (body.format as string || '').trim();
      level = (body.level as string || 'All Levels').trim();
      isPublished = Boolean(body.isPublished);
      isFeatured = Boolean(body.isFeatured);
      isBestseller = Boolean(body.isBestseller);

      storageKey = (body.storageKey as string || '').trim();
      slug = (body.slug as string || '').trim();
      fileSize = (body.fileSize as string || '').trim();

      if (!title) {
        return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
      }

      if (!storageKey) {
        return NextResponse.json({ error: 'File upload is required (storage key missing)' }, { status: 400 });
      }

      // Check storage key for security
      if (!storageKey.startsWith('products/') || storageKey.includes('..')) {
        return NextResponse.json({ error: 'Invalid storage key path' }, { status: 400 });
      }

      // Verify file exists in storage provider and fetch real size
      const storageProvider = getStorageProvider();
      try {
        const meta = await storageProvider.getMetadata(storageKey);
        if (meta && meta.sizeBytes > 0) {
          const sizeInMb = (meta.sizeBytes / (1024 * 1024)).toFixed(1);
          fileSize = `${sizeInMb} MB`;
          const ext = path.extname(storageKey).toLowerCase();
          computedFormat = formatInput || (ext === '.pdf' ? `PDF · ${sizeInMb} MB` : `ZIP · ${sizeInMb} MB`);
        }
      } catch (e) {
        console.warn('Could not read metadata for storageKey:', storageKey, e);
      }

      if (!fileSize) fileSize = '1.0 MB';
      if (!computedFormat) computedFormat = formatInput || `PDF · ${fileSize}`;
      checksumSha256 = crypto.createHash('sha256').update(storageKey).digest('hex');

      // Ensure slug uniqueness
      if (!slug) {
        let baseSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        if (!baseSlug) baseSlug = 'digital-product';
        slug = baseSlug;
      }
      let counter = 1;
      const initialSlug = slug;
      while (await prisma.product.findUnique({ where: { slug } })) {
        counter++;
        slug = `${initialSlug}-${counter}`;
      }
    } else {
      // 1B. Multipart form-data fallback
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string || '').trim();
      categoryRaw = (formData.get('category') as string || 'PLAYBOOK').trim().toUpperCase();
      tagline = (formData.get('tagline') as string || '').trim();
      description = (formData.get('description') as string || '').trim();
      priceStr = formData.get('price') as string || '0';
      compareAtStr = formData.get('compareAtPrice') as string | null;
      formatInput = (formData.get('format') as string || '').trim();
      level = (formData.get('level') as string || 'All Levels').trim();
      isPublished = formData.get('isPublished') === 'true' || formData.get('isPublished') === '1';
      isFeatured = formData.get('isFeatured') === 'true' || formData.get('isFeatured') === '1';
      isBestseller = formData.get('isBestseller') === 'true' || formData.get('isBestseller') === '1';

      if (!title) {
        return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
      }

      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'Please select a PDF or ZIP file to upload' }, { status: 400 });
      }

      // Generate unique slug from title
      let baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (!baseSlug) baseSlug = 'digital-product';

      slug = baseSlug;
      let counter = 1;
      while (await prisma.product.findUnique({ where: { slug } })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }

      // Save uploaded file to private storage
      const originalName = file.name || `${slug}.pdf`;
      let ext = path.extname(originalName).toLowerCase();
      if (!ext) ext = '.pdf';

      const safeFileName = `${slug}${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      const storageProvider = getStorageProvider();
      const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.zip' ? 'application/zip' : 'application/octet-stream';
      storageKey = `products/${safeFileName}`;
      await storageProvider.uploadFile(storageKey, buffer, mimeType);

      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      computedFormat = formatInput || (ext === '.pdf' ? `PDF · ${sizeInMb} MB` : `ZIP · ${sizeInMb} MB`);
      fileSize = `${sizeInMb} MB`;
    }

    // Common Price & Category Validation
    const priceNum = parseFloat(priceStr);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'Price must be a valid number greater than 0' }, { status: 400 });
    }

    let compareAtNum: number | null = null;
    if (compareAtStr && compareAtStr.trim() !== '') {
      const parsed = parseFloat(compareAtStr);
      if (!isNaN(parsed) && parsed > 0) {
        compareAtNum = parsed;
      }
    }

    const category = validCategories.includes(categoryRaw) ? categoryRaw : 'PLAYBOOK';


    // 5. Create product record in database
    const isSqlite =
      process.env.DATABASE_URL?.startsWith('file:') ||
      process.env.DATABASE_URL?.includes('.db');

    const defaultTags = [category, 'Digital Marketing', 'Growth'];
    const defaultWhatYouLearn = [
      'Practical frameworks and step-by-step methodologies.',
      'Battle-tested operating procedures for consistent execution.',
      'Tactical checklists and resource guides.',
    ];
    const defaultWhatsIncluded = [
      computedFormat,
      'Single-operator commercial license.',
      'Instant access & unlimited re-downloads from customer portal.',
    ];
    const defaultFaq = [
      {
        question: 'How do I download my product?',
        answer: 'Immediately after checkout you will receive a secure tokenized download link and customer portal access.',
      },
    ];
    const defaultPreviewPages = [
      `Overview & executive briefing from ${title}.`,
      'Core strategic models, testing principles, and execution protocols.',
    ];

    const product = await prisma.product.create({
      data: {
        slug,
        title,
        category: category as any,
        tagline: tagline || `${title} — Operational marketing notes and tactical implementation frameworks.`,
        description: description || tagline || title,
        priceInPaise: Math.round(priceNum * 100),
        compareAtInPaise: compareAtNum ? Math.round(compareAtNum * 100) : null,
        currency: 'INR',
        format: computedFormat,
        fileSize,
        level,
        storageKey,
        checksumSha256,
        isPublished,
        isFeatured,
        isBestseller,
        sortOrder: 0,
        tags: (isSqlite ? JSON.stringify(defaultTags) : defaultTags) as any,
        whatYouLearn: (isSqlite ? JSON.stringify(defaultWhatYouLearn) : defaultWhatYouLearn) as any,
        whatsIncluded: (isSqlite ? JSON.stringify(defaultWhatsIncluded) : defaultWhatsIncluded) as any,
        faq: (isSqlite ? JSON.stringify(defaultFaq) : defaultFaq) as any,
        previewPages: (isSqlite ? JSON.stringify(defaultPreviewPages) : defaultPreviewPages) as any,
      },
      include: {
        _count: {
          select: { orderItems: true, entitlements: true },
        },
      },
    });

    const clientIp = getClientIp(req);
    await logAuditEvent({
      adminUserId: auth.session.adminUserId,
      action: 'PRODUCT_CREATE',
      targetType: 'PRODUCT',
      targetId: product.id,
      details: {
        title,
        slug,
        price: priceNum,
        isPublished,
        fileName: path.basename(storageKey),
      },
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('Error uploading product:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to upload and create product' },
      { status: 500 }
    );
  }
}
