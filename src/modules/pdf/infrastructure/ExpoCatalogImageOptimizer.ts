import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CatalogImageOptimizer, OptimizedCatalogImage } from '../domain/CatalogImageOptimizer';
import { CatalogImageOptimizationError } from '../domain/CatalogPdfErrors';

const CACHE_DIR_NAME = 'catalog-pdf-cache';
const DEFAULT_MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.65;

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}

function cacheKey(productId: string, imageUri: string): string {
  const hash = simpleHash(imageUri);
  return `${productId}-${hash}.jpg`;
}

export class ExpoCatalogImageOptimizer implements CatalogImageOptimizer {
  private cacheDir: Directory;

  constructor() {
    this.cacheDir = new Directory(Paths.document, CACHE_DIR_NAME);
  }

  async optimizeForPdf(
    imageUri: string,
    productId: string,
    maxDimension = DEFAULT_MAX_DIMENSION,
  ): Promise<OptimizedCatalogImage | null> {
    if (!imageUri) return null;

    if (imageUri.startsWith('data:')) {
      return {
        uri: imageUri,
        width: 0,
        height: 0,
        mimeType: 'image/jpeg',
      };
    }

    try {
      const sourceFile = new File(imageUri);
      if (!sourceFile.exists) {
        console.warn('[ExpoCatalogImageOptimizer] File not found', { uri: imageUri });
        return null;
      }

      this.cacheDir.create({ idempotent: true, intermediates: true });

      const key = cacheKey(productId, imageUri);
      const cachedFile = new File(this.cacheDir, key);

      if (cachedFile.exists) {
        const base64 = await cachedFile.base64();
        return {
          uri: `data:image/jpeg;base64,${base64}`,
          width: maxDimension,
          height: maxDimension,
          mimeType: 'image/jpeg',
        };
      }

      const result = await ImageManipulator.manipulate(imageUri)
        .resize({ width: maxDimension })
        .renderAsync();

      const saved = await result.saveAsync({
        compress: JPEG_QUALITY,
        format: SaveFormat.JPEG,
      });

      const tempFile = new File(saved.uri);
      const base64 = await tempFile.base64();

      if (tempFile.exists) {
        tempFile.copy(cachedFile);
        tempFile.delete();
      }

      return {
        uri: `data:image/jpeg;base64,${base64}`,
        width: maxDimension,
        height: maxDimension,
        mimeType: 'image/jpeg',
      };
    } catch (error) {
      throw new CatalogImageOptimizationError(
        `No se pudo optimizar la imagen del producto ${productId}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async clearCache(): Promise<void> {
    if (this.cacheDir.exists) {
      const files = this.cacheDir.list();
      for (const file of files) {
        try {
          const f = new File(this.cacheDir, file);
          f.delete();
        } catch {
        }
      }
    }
  }
}
