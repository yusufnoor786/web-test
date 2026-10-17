import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, logAuditEvent } from '@/lib/auth/admin';
import { getClientIp } from '@/lib/rate-limit';
import { getStorageProvider } from '@/lib/storage';

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

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Error fetching admin products:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string || '').trim();
    const categoryRaw = (formData.get('category') as string || 'PLAYBOOK').trim().toUpperCase();
    const tagline = (formData.get('tagline') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const priceStr = formData.get('price') as string || '0';
    const compareAtStr = formData.get('compareAtPrice') as string | null;
    const formatInput = (formData.get('format') as string || '').trim();
    const level = (formData.get('level') as string || 'All Levels').trim();
    const isPublished = formData.get('isPublished') === 'true' || formData.get('isPublished') === '1';
    const isFeatured = formData.get('isFeatured') === 'true' || formData.get('isFeatured') === '1';
    const isBestseller = formData.get('isBestseller') === 'true' || formData.get('isBestseller') === '1';

    // 1. Validation
    if (!title) {
      return NextResponse.json({ error: 'Product title is required' }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Please select a PDF or ZIP file to upload' }, { status: 400 });
    }

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

    // Validate category against enum
    const validCategories = ['NOTE', 'GUIDE', 'PLAYBOOK', 'TEMPLATE', 'CASE_STUDY', 'BUNDLE'];
    const category = validCategories.includes(categoryRaw) ? categoryRaw : 'PLAYBOOK';

    // 2. Generate unique slug from title
    let baseSlug = title
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

    // 3. Save uploaded file to private storage
    const originalName = file.name || `${slug}.pdf`;
    let ext = path.extname(originalName).toLowerCase();
    if (!ext) ext = '.pdf';

    const safeFileName = `${slug}${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute cryptographic SHA-256 integrity checksum
    const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const storageProvider = getStorageProvider();
    const mimeType = ext === '.pdf' ? 'application/pdf' : ext === '.zip' ? 'application/zip' : 'application/octet-stream';
    await storageProvider.uploadFile(`products/${safeFileName}`, buffer, mimeType);

    // 4. Compute format & size display
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const computedFormat = formatInput || (ext === '.pdf' ? `PDF · ${sizeInMb} MB` : `ZIP · ${sizeInMb} MB`);
    const fileSize = `${sizeInMb} MB`;

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
        storageKey: `products/${safeFileName}`,
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
        fileName: safeFileName,
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
