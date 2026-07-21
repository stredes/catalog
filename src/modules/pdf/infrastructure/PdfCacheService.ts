import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const CACHE_DIR = new Directory(Paths.document, 'pdf-cache');

export interface PdfCacheEntry {
  uri: string;
  createdAt: string;
}

function ensureCacheDir(): void {
  CACHE_DIR.create({ idempotent: true, intermediates: true });
}

async function computeHash(parts: string[]): Promise<string> {
  const payload = parts.join('||');
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload,
  ).then((hex) => hex.slice(0, 32));
}

async function buildCacheKey(
  catalogName: string,
  format: string,
  purpose: string | undefined,
  productIds: string[],
  familyIds: string[],
  editorialHash?: string,
): Promise<string> {
  const sortedProductIds = [...productIds].sort().join(',');
  const sortedFamilyIds = [...familyIds].sort().join(',');
  const parts = [catalogName, format, purpose ?? 'catalog', sortedProductIds, sortedFamilyIds];
  if (editorialHash) parts.push(editorialHash);
  return computeHash(parts);
}

export class PdfCacheService {
  async findCached(
    catalogName: string,
    format: string,
    purpose: string | undefined,
    productIds: string[],
    familyIds: string[],
    editorialHash?: string,
  ): Promise<PdfCacheEntry | null> {
    ensureCacheDir();
    const hash = await buildCacheKey(catalogName, format, purpose, productIds, familyIds, editorialHash);
    const cached = new File(CACHE_DIR, `${hash}.pdf`);

    if (cached.exists && cached.size > 0) {
      return { uri: cached.uri, createdAt: new Date().toISOString() };
    }
    return null;
  }

  async saveToCache(
    sourceUri: string,
    catalogName: string,
    format: string,
    purpose: string | undefined,
    productIds: string[],
    familyIds: string[],
    editorialHash?: string,
  ): Promise<string> {
    ensureCacheDir();
    const hash = await buildCacheKey(catalogName, format, purpose, productIds, familyIds, editorialHash);
    const cached = new File(CACHE_DIR, `${hash}.pdf`);

    const source = new File(sourceUri);
    source.copy(cached);

    return cached.uri;
  }

  clearCache(): void {
    ensureCacheDir();
    const files = CACHE_DIR.list();
    for (const entry of files) {
      const file = new File(entry);
      if (file.exists) {
        file.delete();
      }
    }
  }
}
