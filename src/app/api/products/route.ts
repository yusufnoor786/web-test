import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featuredOnly = searchParams.get('featured') === 'true';

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }

    if (featuredOnly) {
      where.isFeatured = true;
    }

    const rawProducts = await prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        tagline: true,
        priceInPaise: true,
        compareAtInPaise: true,
        format: true,
        pageCount: true,
        level: true,
        isBestseller: true,
        isFeatured: true,
        previewPages: true,
      },
    });

    const products = rawProducts.map((p) => ({
      ...p,
      price: Math.round(p.priceInPaise / 100),
      compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Error fetching public products:', err);
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}
