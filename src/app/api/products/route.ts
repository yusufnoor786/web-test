import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ALL_DEFAULT_ITEMS } from '@/lib/catalog/default-products';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const featuredOnly = searchParams.get('featured') === 'true';

  try {
    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }

    if (featuredOnly) {
      where.isFeatured = true;
    }

    let rawProducts = await prisma.product.findMany({
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

    if (rawProducts.length === 0) {
      let filtered = ALL_DEFAULT_ITEMS;
      if (category && category !== 'ALL') {
        filtered = filtered.filter((p) => p.category === category.toUpperCase());
      }
      if (featuredOnly) {
        filtered = filtered.filter((p) => p.isFeatured);
      }
      rawProducts = filtered as any;
    }

    const products = rawProducts.map((p) => ({
      ...p,
      price: Math.round(p.priceInPaise / 100),
      compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Database query fallback for products:', err);
    let filtered = ALL_DEFAULT_ITEMS;
    if (category && category !== 'ALL') {
      filtered = filtered.filter((p) => p.category === category.toUpperCase());
    }
    if (featuredOnly) {
      filtered = filtered.filter((p) => p.isFeatured);
    }
    const products = filtered.map((p) => ({
      ...p,
      price: Math.round(p.priceInPaise / 100),
      compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
    }));
    return NextResponse.json({ products });
  }
}
