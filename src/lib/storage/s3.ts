import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import path from 'node:path';
import { StorageFileInfo, StorageProvider, StorageStreamResult } from './types';
import { LocalStorageProvider } from './local';

/**
 * S3CompatibleStorageProvider supports Cloudflare R2, AWS S3, MinIO, and DigitalOcean Spaces.
 * Automatically falls back to LocalStorageProvider if cloud credentials are not provided.
 */
export class S3CompatibleStorageProvider implements StorageProvider {
  private client: S3Client | null = null;
  private bucket: string;
  private fallback: LocalStorageProvider;

  constructor(bucket?: string) {
    this.fallback = new LocalStorageProvider();

    this.bucket =
      bucket ||
      process.env.R2_BUCKET ||
      process.env.CLOUDFLARE_R2_BUCKET ||
      process.env.S3_BUCKET ||
      '';

    const accountId =
      process.env.R2_ACCOUNT_ID ||
      process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
      '';

    const accessKeyId =
      process.env.R2_ACCESS_KEY_ID ||
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
      process.env.S3_ACCESS_KEY_ID ||
      '';

    const secretAccessKey =
      process.env.R2_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
      process.env.S3_SECRET_ACCESS_KEY ||
      '';

    // R2 endpoint convention: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    const endpoint =
      process.env.R2_ENDPOINT ||
      process.env.S3_ENDPOINT ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    if (this.bucket && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.bucket);
  }

  private cleanKey(storageKey: string): string {
    return storageKey.replace(/^\/+/, '');
  }

  async exists(storageKey: string): Promise<boolean> {
    if (!this.client || !this.bucket) {
      return this.fallback.exists(storageKey);
    }

    try {
      const key = this.cleanKey(storageKey);
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (err: unknown) {
      const error = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      return this.fallback.exists(storageKey);
    }
  }

  async getMetadata(storageKey: string): Promise<StorageFileInfo> {
    if (!this.client || !this.bucket) {
      return this.fallback.getMetadata(storageKey);
    }

    try {
      const key = this.cleanKey(storageKey);
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      const fileName = path.basename(key);
      const mimeType =
        res.ContentType ||
        (fileName.endsWith('.pdf')
          ? 'application/pdf'
          : fileName.endsWith('.zip')
          ? 'application/zip'
          : 'application/octet-stream');

      return {
        sizeBytes: res.ContentLength || 0,
        mimeType,
        fileName,
      };
    } catch {
      return this.fallback.getMetadata(storageKey);
    }
  }

  async openStream(storageKey: string): Promise<StorageStreamResult> {
    if (!this.client || !this.bucket) {
      return this.fallback.openStream(storageKey);
    }

    const key = this.cleanKey(storageKey);
    const fileName = path.basename(key);

    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      if (!res.Body) {
        throw new Error(`Empty stream returned from R2/S3 for: ${storageKey}`);
      }

      const stream = res.Body as NodeJS.ReadableStream;
      const sizeBytes = res.ContentLength || 0;
      const mimeType =
        res.ContentType ||
        (fileName.endsWith('.pdf')
          ? 'application/pdf'
          : fileName.endsWith('.zip')
          ? 'application/zip'
          : 'application/octet-stream');

      return {
        stream,
        sizeBytes,
        mimeType,
        fileName,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Storage] Cloudflare R2 / S3 fetch failed for key "${key}", falling back to local:`, msg);
      return this.fallback.openStream(storageKey);
    }
  }

  async uploadFile(storageKey: string, buffer: Buffer, mimeType?: string): Promise<void> {
    // If not configured, save locally
    if (!this.client || !this.bucket) {
      return this.fallback.uploadFile(storageKey, buffer, mimeType);
    }

    const key = this.cleanKey(storageKey);
    const fileName = path.basename(key);
    const resolvedMime =
      mimeType ||
      (fileName.endsWith('.pdf')
        ? 'application/pdf'
        : fileName.endsWith('.zip')
        ? 'application/zip'
        : 'application/octet-stream');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: resolvedMime,
      })
    );
  }
}
