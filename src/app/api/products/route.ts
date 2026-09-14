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

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        tagline: true,
        price: true,
        compareAtPrice: true,
        format: true,
        pageCount: true,
        level: true,
        isBestseller: true,
        isFeatured: true,
        previewPages: true,
      },
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error('Error fetching public products:', err);
    return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
  }
}
