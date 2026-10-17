import { LocalStorageProvider } from '../src/lib/storage/local';

async function main() {
  console.log('[Test Storage] Starting storage provider verification...');

  const storage = new LocalStorageProvider();

  // Test 1: Valid asset existence and metadata
  const validKey = 'products/meta-ads-playbook.pdf';
  const exists = await storage.exists(validKey);
  console.log(`[Test Storage] Asset "${validKey}" exists: ${exists}`);

  if (!exists) {
    throw new Error(`Expected asset "${validKey}" to exist.`);
  }

  const meta = await storage.getMetadata(validKey);
  console.log(`[Test Storage] Asset metadata: ${meta.fileName}, size: ${meta.sizeBytes} bytes, type: ${meta.mimeType}`);

  if (meta.mimeType !== 'application/pdf') {
    throw new Error(`Expected MIME type application/pdf, got ${meta.mimeType}`);
  }

  // Test 2: Stream opening
  const streamResult = await storage.openStream(validKey);
  console.log(`[Test Storage] Successfully opened readable stream for "${streamResult.fileName}"`);

  // Test 3: Path traversal attempt prevention
  console.log('[Test Storage] Testing path traversal attack defenses...');
  const maliciousKeys = [
    '../../prisma/schema.prisma',
    '../../../etc/passwd',
    '..\\..\\windows\\system32',
    'products/../../package.json',
  ];

  for (const attackKey of maliciousKeys) {
    try {
      await storage.openStream(attackKey);
      throw new Error(`SECURITY FAILURE: Path traversal was not blocked for key "${attackKey}"!`);
    } catch (err: any) {
      if (err.message.includes('SECURITY FAILURE')) {
        throw err;
      }
      console.log(`[Test Storage] Correctly rejected malicious path "${attackKey}": ${err.message}`);
    }
  }

  // Test 4: Missing asset error handling
  console.log('[Test Storage] Testing missing asset error handling...');
  const missingKey = 'products/non-existent-ghost-file.pdf';
  try {
    await storage.openStream(missingKey);
    throw new Error('Expected missing file to throw an error.');
  } catch (err: any) {
    console.log(`[Test Storage] Correctly threw error on missing asset: ${err.message}`);
  }

  console.log('[Test Storage] ALL STORAGE PROVIDER TESTS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('[Test Storage] FAILED:', err);
  process.exit(1);
});
