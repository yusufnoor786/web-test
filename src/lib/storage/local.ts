import fs from 'node:fs';
import path from 'node:path';
import { StorageFileInfo, StorageProvider, StorageStreamResult } from './types';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(customBaseDir?: string) {
    this.baseDir = customBaseDir || path.join(process.cwd(), 'storage', 'products');
  }

  /**
   * Safely resolves a storage key to an absolute filesystem path inside the sandbox.
   * Throws if path traversal is attempted.
   */
  private resolveSafePath(storageKey: string): string {
    if (!storageKey || typeof storageKey !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }

    if (storageKey.includes('\0')) {
      throw new Error('Access denied: Poison null byte detected');
    }

    // Normalize and strip directory traversal patterns
    let safeKey = path.normalize(storageKey).replace(/^(\.\.(\/|\\|$))+/, '');

    // Strip leading products/ if included in storageKey
    if (safeKey.startsWith('products/') || safeKey.startsWith('products\\')) {
      safeKey = safeKey.slice(9);
    }

    const absolutePath = path.join(this.baseDir, safeKey);

    // Assert strictly inside base sandbox
    if (!absolutePath.startsWith(this.baseDir)) {
      throw new Error('Access denied: Storage path traversal attempt');
    }

    return absolutePath;
  }

  private resolveMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.zip')) return 'application/zip';
    if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.csv')) return 'text/csv';
    return 'application/octet-stream';
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      const absPath = this.resolveSafePath(storageKey);
      return fs.existsSync(absPath) && fs.statSync(absPath).isFile();
    } catch {
      return false;
    }
  }

  async getMetadata(storageKey: string): Promise<StorageFileInfo> {
    const absPath = this.resolveSafePath(storageKey);

    if (!fs.existsSync(absPath)) {
      throw new Error(`Asset not found in storage: ${storageKey}`);
    }

    const stat = await fs.promises.stat(absPath);
    if (!stat.isFile()) {
      throw new Error(`Target is not a valid file: ${storageKey}`);
    }

    const fileName = path.basename(absPath);
    const mimeType = this.resolveMimeType(fileName);

    return {
      sizeBytes: stat.size,
      mimeType,
      fileName,
      fullPath: absPath,
    };
  }

  async openStream(storageKey: string): Promise<StorageStreamResult> {
    const metadata = await this.getMetadata(storageKey);
    const absPath = metadata.fullPath!;

    // Test readability with open descriptor before returning stream
    const fd = await fs.promises.open(absPath, 'r');
    await fd.close(); // Confirms readable permissions without holding lock

    const stream = fs.createReadStream(absPath);

    return {
      stream,
      sizeBytes: metadata.sizeBytes,
      mimeType: metadata.mimeType,
      fileName: metadata.fileName,
    };
  }

  async uploadFile(storageKey: string, buffer: Buffer, _mimeType?: string): Promise<void> {
    const absPath = this.resolveSafePath(storageKey);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(absPath, buffer);
  }

  async getPresignedUploadUrl(_storageKey: string, _contentType: string, _expiresInSeconds?: number): Promise<string | null> {
    return null;
  }
}


