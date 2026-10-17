/// <reference types="node" />

export interface StorageFileInfo {
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  checksumSha256?: string;
  fullPath?: string;
}

export interface StorageStreamResult {
  stream: NodeJS.ReadableStream;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
}

export interface StorageProvider {
  /**
   * Opens a binary readable stream for the target storage key.
   * Throws an error if the asset cannot be opened or does not exist.
   */
  openStream(storageKey: string): Promise<StorageStreamResult>;

  /**
   * Checks whether the asset exists in storage.
   */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Retrieves file metadata without reading the whole payload.
   */
  getMetadata(storageKey: string): Promise<StorageFileInfo>;

  /**
   * Uploads and persists a file to storage.
   */
  uploadFile(storageKey: string, buffer: Buffer, mimeType?: string): Promise<void>;
}
