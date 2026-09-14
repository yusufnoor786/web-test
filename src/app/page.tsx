import React from 'react';
import { prisma } from '@/lib/prisma';
import { HomeClient } from '@/components/HomeClient';

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  const [featuredProducts, allProducts, bundles] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, isFeatured: true, category: { not: 'BUNDLES' } },
      orderBy: { sortOrder: 'asc' },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isPublished: true, category: { not: 'BUNDLES' } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.product.findMany({
      where: { isPublished: true, category: 'BUNDLES' },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return (
    <HomeClient
      featuredProducts={featuredProducts}
      allProducts={allProducts}
      bundles={bundles}
    />
  );
}
