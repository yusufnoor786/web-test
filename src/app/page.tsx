import React from 'react';
import { prisma } from '@/lib/prisma';
import { HomeClient } from '@/components/HomeClient';

export const revalidate = 60; // ISR cache for 60 seconds

function mapProductToClient(p: any) {
  return {
    ...p,
    price: Math.round(p.priceInPaise / 100),
    compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
  };
}

export default async function HomePage() {
  const [featuredProducts, allProducts, bundles] = await Promise.all([
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

  return (
    <HomeClient
      featuredProducts={featuredProducts.map(mapProductToClient)}
      allProducts={allProducts.map(mapProductToClient)}
      bundles={bundles.map(mapProductToClient)}
    />
  );
}
