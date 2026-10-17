import React from 'react';
import { prisma } from '@/lib/prisma';
import { StoreClient } from '@/components/StoreClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalog & Digital Library | The Growth Archive',
  description:
    'Explore the complete collection of digital marketing notes, tactical playbooks, operating system templates, and real growth experiment post-mortems.',
};

export const revalidate = 60;

function mapProductToClient(p: any) {
  return {
    ...p,
    price: Math.round(p.priceInPaise / 100),
    compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
  };
}

export default async function StorePage() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return <StoreClient initialProducts={products.map(mapProductToClient)} />;
}
