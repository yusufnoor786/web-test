import React from 'react';
import { prisma } from '@/lib/prisma';
import { HomeClient } from '@/components/HomeClient';
import {
  getDefaultFeaturedProducts,
  getDefaultProducts,
  getDefaultBundles,
} from '@/lib/catalog/default-products';

export const dynamic = 'force-dynamic';

function mapProductToClient(p: any) {
  return {
    ...p,
    price: Math.round(p.priceInPaise / 100),
    compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
  };
}

export default async function HomePage() {
  let featuredProducts: any[] = [];
  let allProducts: any[] = [];
  let bundles: any[] = [];

  try {
    const results = await Promise.all([
      prisma.product.findMany({
        where: { isPublished: true, isFeatured: true, category: { not: 'BUNDLE' } },
        orderBy: { sortOrder: 'asc' },
        take: 4,
      }),
      prisma.product.findMany({
        where: { isPublished: true, category: { not: 'BUNDLE' } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.product.findMany({
        where: { isPublished: true, category: 'BUNDLE' },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    featuredProducts = results[0];
    allProducts = results[1];
    bundles = results[2];
  } catch (err) {
    console.error('[HomePage] Failed to fetch products:', err);
  }

  // Graceful fallback to default curated catalog if database is not yet seeded
  if (featuredProducts.length === 0) {
    featuredProducts = getDefaultFeaturedProducts();
  }
  if (allProducts.length === 0) {
    allProducts = getDefaultProducts();
  }
  if (bundles.length === 0) {
    bundles = getDefaultBundles();
  }

  return (
    <HomeClient
      featuredProducts={featuredProducts.map(mapProductToClient)}
      allProducts={allProducts.map(mapProductToClient)}
      bundles={bundles.map(mapProductToClient)}
    />
  );
}
