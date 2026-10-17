import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ProductDetailClient } from '@/components/ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

function mapProductToClient(p: any) {
  return {
    ...p,
    price: Math.round(p.priceInPaise / 100),
    compareAtPrice: p.compareAtInPaise ? Math.round(p.compareAtInPaise / 100) : null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return {
      title: 'Product Not Found | The Growth Archive',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title: `${product.title} (${product.format})`,
    description: product.tagline || product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.tagline || product.description.slice(0, 160),
      url: `${siteUrl}/products/${product.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.tagline || product.description.slice(0, 160),
    },
    alternates: {
      canonical: `${siteUrl}/products/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const productRaw = await prisma.product.findUnique({
    where: { slug, isPublished: true },
  });

  if (!productRaw) {
    notFound();
  }

  const product = mapProductToClient(productRaw);

  // Fetch related products in the same or complementary category
  const relatedProductsRaw = await prisma.product.findMany({
    where: {
      isPublished: true,
      id: { not: product.id },
      category: { not: 'BUNDLE' },
    },
    take: 3,
    orderBy: { sortOrder: 'asc' },
  });

  const relatedProducts = relatedProductsRaw.map(mapProductToClient);

  // Schema.org Product & Offer structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.tagline || product.description,
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: 'https://schema.org/InStock',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/products/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
