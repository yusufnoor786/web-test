import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStorageProvider } from '@/lib/storage';
import { ALL_DEFAULT_ITEMS } from '@/lib/catalog/default-products';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    // 1. Fetch product by slug from Neon PostgreSQL DB, falling back to defaults
    let storageKey = '';
    let title = '';
    let format = '';

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { title: true, storageKey: true, format: true },
    });

    if (product) {
      storageKey = product.storageKey;
      title = product.title;
      format = product.format;
    } else {
      const fallback = ALL_DEFAULT_ITEMS.find((p) => p.slug === slug);
      if (fallback) {
        storageKey = fallback.storageKey;
        title = fallback.title;
        format = fallback.format;
      }
    }

    if (!storageKey) {
      return NextResponse.json({ error: 'Product asset not found' }, { status: 404 });
    }

    const lowerKey = storageKey.toLowerCase();
    const isPdf = lowerKey.endsWith('.pdf');

    // If client just wants metadata info
    const isInfoRequest = req.nextUrl.searchParams.get('info') === 'true';

    if (!isPdf) {
      return NextResponse.json(
        {
          isPdf: false,
          format: format || 'Digital ZIP Archive',
          title,
          message: 'Interactive PDF preview is not applicable for ZIP archive bundles.',
        },
        { status: isInfoRequest ? 200 : 400 }
      );
    }

    // 2. Stream target PDF from storage provider (Cloudflare R2 or Local filesystem)
    const storageProvider = getStorageProvider();
    const streamResult = await storageProvider.openStream(storageKey);

    const chunks: Buffer[] = [];
    for await (const chunk of streamResult.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const fullBuffer = Buffer.concat(chunks);

    // 3. Extract sample pages using pdf-lib
    const pdfDoc = await PDFDocument.load(fullBuffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();

    // Sample up to 3 pages
    const previewCount = Math.min(totalPages, totalPages <= 2 ? 1 : 3);
    const pageIndices = Array.from({ length: previewCount }, (_, i) => i);

    if (isInfoRequest) {
      return NextResponse.json({
        isPdf: true,
        title,
        format,
        totalPages,
        previewCount,
        hasPreview: true,
      });
    }

    const previewDoc = await PDFDocument.create();
    const copiedPages = await previewDoc.copyPages(pdfDoc, pageIndices);

    // Embed fonts for security watermarks and header/footer metadata
    let font;
    let regularFont;
    try {
      font = await previewDoc.embedFont(StandardFonts.HelveticaBold);
      regularFont = await previewDoc.embedFont(StandardFonts.Helvetica);
    } catch {
      // Graceful fallback if standard font fails
    }

    for (let i = 0; i < copiedPages.length; i++) {
      const page = copiedPages[i];
      const { width, height } = page.getSize();

      if (font && regularFont) {
        // Diagonal watermark across center of sample page
        const watermarkText = 'SAMPLE PREVIEW ONLY';
        const textSize = Math.min(width, height) * 0.055;
        const textWidth = font.widthOfTextAtSize(watermarkText, textSize);

        page.drawText(watermarkText, {
          x: Math.max(20, (width - textWidth) / 2),
          y: height / 2 - 20,
          size: textSize,
          font,
          color: rgb(0.65, 0.65, 0.65),
          opacity: 0.28,
          rotate: degrees(30),
        });

        // Top branding & page position notice
        const topBanner = `THE GROWTH ARCHIVE — SAMPLE PREVIEW (PAGE ${i + 1} OF ${totalPages})`;
        page.drawText(topBanner, {
          x: 20,
          y: height - 16,
          size: 7,
          font: regularFont,
          color: rgb(0.5, 0.45, 0.4),
          opacity: 0.75,
        });

        // Bottom purchase protection notice
        const bottomBanner = `SAMPLE COPY • FULL ${totalPages}-PAGE UNRESTRICTED EDITION UNLOCKED UPON PURCHASE`;
        page.drawText(bottomBanner, {
          x: 20,
          y: 12,
          size: 7,
          font: regularFont,
          color: rgb(0.5, 0.45, 0.4),
          opacity: 0.75,
        });
      }

      previewDoc.addPage(page);
    }

    const previewBytes = await previewDoc.save();

    return new NextResponse(Buffer.from(previewBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${slug}-sample-preview.pdf"`,
        'Content-Length': String(previewBytes.length),
        'X-Total-Pages': String(totalPages),
        'X-Preview-Pages': String(previewCount),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  } catch (err: unknown) {
    console.error('Error generating PDF preview:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate PDF preview' },
      { status: 500 }
    );
  }
}
