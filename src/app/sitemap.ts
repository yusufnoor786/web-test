import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/store`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/license`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const dbUrl = process.env.DATABASE_URL || '';
  const canQueryDb =
    dbUrl.startsWith('postgresql://') ||
    dbUrl.startsWith('postgres://') ||
    dbUrl.startsWith('file:');

  if (canQueryDb) {
    try {
      const products = await prisma.product.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      });

      for (const p of products) {
        routes.push({
          url: `${siteUrl}/products/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.85,
        });
      }
    } catch {
      // Graceful fallback: return standard static routes
    }
  }

  return routes;
}
