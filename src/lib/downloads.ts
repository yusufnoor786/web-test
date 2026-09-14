import crypto from 'node:crypto';
import { prisma } from './prisma';
import { getPrivateProductFile, StorageFileInfo } from './storage';

export interface IssuedEntitlementToken {
  entitlementId: string;
  productId: string;
  productTitle: string;
  rawToken: string;
  downloadUrl: string;
}

/**
 * Hashes a raw download token using SHA-256 for secure storage.
 */
export function hashDownloadToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Creates download entitlements for an order's items and returns unhashed raw tokens
 * for the customer session / email link.
 */
export async function createOrderEntitlements(orderId: string): Promise<IssuedEntitlementToken[]> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const issuedTokens: IssuedEntitlementToken[] = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  for (const item of order.items) {
    const product = item.product;

    // Check if this product is a bundle that unlocks multiple products
    let productIdsToGrant = [product.id];
    if (product.bundleProductIds) {
      try {
        const bundledIds = JSON.parse(product.bundleProductIds);
        if (Array.isArray(bundledIds) && bundledIds.length > 0) {
          productIdsToGrant = bundledIds;
        }
      } catch (e) {
        console.error('Failed to parse bundleProductIds:', e);
      }
    }

    for (const pid of productIdsToGrant) {
      // Check if entitlement already exists for this order + product
      const existing = await prisma.downloadEntitlement.findFirst({
        where: {
          orderId: order.id,
          productId: pid,
        },
        include: { product: true },
      });

      if (existing) {
        // If already exists (e.g. from duplicate webhook), reuse or generate fresh token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashDownloadToken(rawToken);
        await prisma.downloadEntitlement.update({
          where: { id: existing.id },
          data: { tokenHash },
        });

        issuedTokens.push({
          entitlementId: existing.id,
          productId: existing.productId,
          productTitle: existing.product.title,
          rawToken,
          downloadUrl: `${siteUrl}/api/download/${rawToken}/${existing.productId}`,
        });
        continue;
      }

      const pTarget = await prisma.product.findUnique({ where: { id: pid } });
      if (!pTarget) continue;

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashDownloadToken(rawToken);

      // Default: 30-day token validity, 5 downloads allowed
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const entitlement = await prisma.downloadEntitlement.create({
        data: {
          orderId: order.id,
          productId: pid,
          tokenHash,
          maxDownloads: 5,
          downloadCount: 0,
          expiresAt,
        },
        include: { product: true },
      });

      issuedTokens.push({
        entitlementId: entitlement.id,
        productId: entitlement.productId,
        productTitle: entitlement.product.title,
        rawToken,
        downloadUrl: `${siteUrl}/api/download/${rawToken}/${entitlement.productId}`,
      });
    }
  }

  return issuedTokens;
}

export interface ValidatedDownload {
  entitlementId: string;
  productId: string;
  orderNumber: string;
  fileInfo: StorageFileInfo;
  downloadCount: number;
  maxDownloads: number;
}

/**
 * Validates a download request against token, order status, expiration, and remaining download count.
 */
export async function validateAndAuthorizeDownload(
  rawToken: string,
  productId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<ValidatedDownload> {
  if (!rawToken || !productId) {
    throw new Error('Missing download token or product identifier');
  }

  const tokenHash = hashDownloadToken(rawToken);

  const entitlement = await prisma.downloadEntitlement.findFirst({
    where: {
      tokenHash,
      productId,
    },
    include: {
      order: true,
      product: true,
    },
  });

  if (!entitlement) {
    throw new Error('Invalid download token or product mismatch');
  }

  if (entitlement.revokedAt) {
    throw new Error('This download entitlement has been revoked');
  }

  if (entitlement.order.status !== 'PAID') {
    throw new Error('Order payment is not completed or has been refunded');
  }

  if (entitlement.expiresAt && entitlement.expiresAt.getTime() < Date.now()) {
    throw new Error('This download link has expired. Please use purchase recovery to generate a fresh link');
  }

  if (entitlement.downloadCount >= entitlement.maxDownloads) {
    throw new Error(`Download limit reached (${entitlement.maxDownloads} downloads allowed)`);
  }

  // Retrieve actual file securely from private storage
  const fileInfo = getPrivateProductFile(entitlement.product.filePath);

  // Increment download count & record audit event
  await prisma.$transaction([
    prisma.downloadEntitlement.update({
      where: { id: entitlement.id },
      data: { downloadCount: entitlement.downloadCount + 1 },
    }),
    prisma.downloadEvent.create({
      data: {
        entitlementId: entitlement.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    }),
  ]);

  return {
    entitlementId: entitlement.id,
    productId: entitlement.productId,
    orderNumber: entitlement.order.orderNumber,
    fileInfo,
    downloadCount: entitlement.downloadCount + 1,
    maxDownloads: entitlement.maxDownloads,
  };
}
