import fs from 'node:fs';
import path from 'node:path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'products');

export interface StorageFileInfo {
  fullPath: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
}

/**
 * Safely resolves a product file path inside the private storage directory.
 * Throws an error if any path traversal (e.g. `../`) is attempted.
 */
export function getPrivateProductFile(relativeFilePath: string): StorageFileInfo {
  if (!relativeFilePath) {
    throw new Error('File path must not be empty');
  }

  // Normalize and prevent directory traversal
  const safePath = path.normalize(relativeFilePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(STORAGE_ROOT, safePath);

  // Ensure resolved path is strictly inside STORAGE_ROOT
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw new Error('Access denied: Invalid storage path traversal attempt');
  }

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${safePath}`);
  }

  const stat = fs.statSync(absolutePath);
  if (!stat.isFile()) {
    throw new Error('Target is not a valid file');
  }

  let mimeType = 'application/octet-stream';
  if (absolutePath.endsWith('.pdf')) {
    mimeType = 'application/pdf';
  } else if (absolutePath.endsWith('.zip')) {
    mimeType = 'application/zip';
  }

  return {
    fullPath: absolutePath,
    sizeBytes: stat.size,
    mimeType,
    fileName: path.basename(absolutePath),
  };
}
