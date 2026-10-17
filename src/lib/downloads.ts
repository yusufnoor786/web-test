import crypto from 'node:crypto';
import { prisma } from './prisma';
import { getStorageProvider, StorageFileInfo } from './storage';

export interface IssuedEntitlementToken {
  entitlementId: string;
  productId: string;
  productTitle: string;
  rawToken: string;
  downloadUrl: string;
}

/**
 * Hashes a raw download token using SHA-256 for secure database storage.
 */
export function hashDownloadToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Creates download entitlements for an order's items and issues ephemeral 15-minute
 * single-use download grants for immediate access.
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
    if (product.category === 'BUNDLE') {
      const bundleItems = await prisma.bundleItem.findMany({
        where: { bundleId: product.id },
        select: { productId: true },
      });
      if (bundleItems.length > 0) {
        productIdsToGrant = bundleItems.map((bi) => bi.productId);
      }
    }

    for (const pid of productIdsToGrant) {
      // Upsert entitlement (permanent customer ownership)
      const entitlement = await prisma.downloadEntitlement.upsert({
        where: {
          orderId_productId: {
            orderId: order.id,
            productId: pid,
          },
        },
        update: {},
        create: {
          orderId: order.id,
          productId: pid,
          customerId: order.customerId,
          maxDownloads: 5,
          downloadCount: 0,
          isRevoked: false,
        },
        include: { product: true },
      });

      // Generate ephemeral 15-minute single-use DownloadGrant
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashDownloadToken(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.downloadGrant.create({
        data: {
          entitlementId: entitlement.id,
          tokenHash,
          expiresAt,
          usedAt: null,
        },
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

export interface ValidatedGrantContext {
  grant: {
    id: string;
    entitlementId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
  };
  entitlement: {
    id: string;
    orderId: string;
    productId: string;
    customerId: string;
    maxDownloads: number;
    downloadCount: number;
    isRevoked: boolean;
    revokedReason: string | null;
  };
  product: {
    id: string;
    title: string;
    storageKey: string;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

/**
 * Validates a download grant without consuming it.
 * Verifies grant token, expiration, revocation, and remaining download quota.
 */
export async function validateDownloadGrant(
  rawToken: string,
  productId: string
): Promise<ValidatedGrantContext> {
  if (!rawToken || !productId) {
    throw new Error('Missing download token or product identifier');
  }

  const tokenHash = hashDownloadToken(rawToken);

  const grant = await prisma.downloadGrant.findUnique({
    where: { tokenHash },
    include: {
      entitlement: {
        include: {
          order: true,
          product: true,
        },
      },
    },
  });

  if (!grant) {
    throw new Error('Invalid download token');
  }

  if (grant.usedAt) {
    throw new Error('This single-use download token has already been used. Please request a fresh download link from your purchase portal.');
  }

  if (grant.expiresAt.getTime() < Date.now()) {
    throw new Error('This download authorization has expired. Please request a fresh download link from your purchase portal.');
  }

  const entitlement = grant.entitlement;

  if (entitlement.productId !== productId) {
    throw new Error('Token does not match requested product');
  }

  if (entitlement.isRevoked) {
    throw new Error('This download entitlement has been revoked');
  }

  if (entitlement.order.status !== 'PAID') {
    throw new Error('Order payment is not completed or has been refunded');
  }

  if (entitlement.downloadCount >= entitlement.maxDownloads) {
    throw new Error(`Download limit reached (${entitlement.maxDownloads} downloads allowed)`);
  }

  return {
    grant: {
      id: grant.id,
      entitlementId: grant.entitlementId,
      tokenHash: grant.tokenHash,
      expiresAt: grant.expiresAt,
      usedAt: grant.usedAt,
    },
    entitlement: {
      id: entitlement.id,
      orderId: entitlement.orderId,
      productId: entitlement.productId,
      customerId: entitlement.customerId,
      maxDownloads: entitlement.maxDownloads,
      downloadCount: entitlement.downloadCount,
      isRevoked: entitlement.isRevoked,
      revokedReason: entitlement.revokedReason,
    },
    product: {
      id: entitlement.product.id,
      title: entitlement.product.title,
      storageKey: entitlement.product.storageKey,
    },
    order: {
      id: entitlement.order.id,
      orderNumber: entitlement.order.orderNumber,
      status: entitlement.order.status,
    },
  };
}

/**
 * Atomically consumes a DownloadGrant and increments entitlement downloadCount.
 * MUST only be invoked once the file stream is successfully opened and confirmed readable.
 */
export async function consumeDownloadGrant(
  grantId: string,
  entitlementId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  await prisma.$transaction([
    prisma.downloadGrant.update({
      where: { id: grantId },
      data: {
        usedAt: new Date(),
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    }),
    prisma.downloadEntitlement.update({
      where: { id: entitlementId },
      data: { downloadCount: { increment: 1 } },
    }),
    prisma.downloadEvent.create({
      data: {
        entitlementId,
        grantId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      },
    }),
  ]);
}

export interface ValidatedDownload {
  entitlementId: string;
  grantId: string;
  productId: string;
  orderNumber: string;
  fileInfo: StorageFileInfo;
  downloadCount: number;
  maxDownloads: number;
}

/**
 * Validates a download request and safely acquires the storage file BEFORE consuming the grant.
 */
export async function validateAndAuthorizeDownload(
  rawToken: string,
  productId: string,
  meta?: { ipAddress?: string; userAgent?: string }
): Promise<ValidatedDownload> {
  const ctx = await validateDownloadGrant(rawToken, productId);

  // Retrieve actual file metadata/presence securely from private storage BEFORE consuming grant
  const storageProvider = getStorageProvider();
  const fileInfo = await storageProvider.getMetadata(ctx.product.storageKey);

  // Atomically consume the single-use grant, increment download quota, and record audit event
  await consumeDownloadGrant(ctx.grant.id, ctx.entitlement.id, meta);

  return {
    entitlementId: ctx.entitlement.id,
    grantId: ctx.grant.id,
    productId: ctx.product.id,
    orderNumber: ctx.order.orderNumber,
    fileInfo,
    downloadCount: ctx.entitlement.downloadCount + 1,
    maxDownloads: ctx.entitlement.maxDownloads,
  };
}
