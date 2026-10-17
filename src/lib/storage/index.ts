import fs from 'node:fs';
import path from 'node:path';
import { StorageProvider, StorageFileInfo } from './types';
import { LocalStorageProvider } from './local';
import { S3CompatibleStorageProvider } from './s3';

export * from './types';
export * from './local';
export * from './s3';

let singletonStorage: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!singletonStorage) {
    const isCloudConfigured =
      process.env.STORAGE_PROVIDER === 's3' ||
      process.env.STORAGE_PROVIDER === 'r2' ||
      Boolean(process.env.R2_BUCKET || process.env.S3_BUCKET);

    if (isCloudConfigured) {
      singletonStorage = new S3CompatibleStorageProvider();
    } else {
      singletonStorage = new LocalStorageProvider();
    }
  }
  return singletonStorage;
}

/**
 * Backward-compatible helper for synchronous file resolution in existing routes.
 */
export function getPrivateProductFile(relativeFilePath: string): StorageFileInfo & { fullPath: string } {
  const localProvider = new LocalStorageProvider();
  // Using node:fs directly for synchronous legacy compatibility
  const absPath = (localProvider as unknown as { resolveSafePath: (k: string) => string }).resolveSafePath(relativeFilePath);
  const meta = {
    fullPath: absPath,
    sizeBytes: 0,
    mimeType: 'application/octet-stream',
    fileName: '',
  };

  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found in storage: ${relativeFilePath}`);
  }

  const stat = fs.statSync(absPath);
  meta.sizeBytes = stat.size;
  meta.fileName = path.basename(absPath);

  if (meta.fileName.endsWith('.pdf')) {
    meta.mimeType = 'application/pdf';
  } else if (meta.fileName.endsWith('.zip')) {
    meta.mimeType = 'application/zip';
  }

  return meta;
}
