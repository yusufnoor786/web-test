import React from 'react';
import { prisma } from '@/lib/prisma';
import { StoreClient } from '@/components/StoreClient';
import { ALL_DEFAULT_ITEMS } from '@/lib/catalog/default-products';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalog & Digital Library | The Growth Archive',
  description:
    'Explore the complete collection of digital marketing notes, tactical playbooks, operating system templates, and real growth experiment post-mortems.',
};

export const dynamic = 'force-dynamic';

function mapProductToClient(p: any) {
  return {
    ...p,
    price: Math.round(p.priceInPaise / 100),
    compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
  };
}

export default async function StorePage() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  } catch (err) {
    console.error('[StorePage] Failed to fetch products:', err);
  }

  if (products.length === 0) {
    products = ALL_DEFAULT_ITEMS;
  }

  return <StoreClient initialProducts={products.map(mapProductToClient)} />;
}
