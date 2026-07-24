import { Directory, File, Paths } from 'expo-file-system';
import { Product } from '../../../products/domain/entities/product';
import { Profile } from '../../../profile/domain/entities/profile';
import { BackupImageMap } from '../../domain/entities/BackupSnapshot';

const IMAGES_DIR = new Directory(Paths.document, 'product-images');

async function fileToBase64DataUri(filePath: string): Promise<string | null> {
  try {
    const file = new File(filePath);
    if (!file.exists) return null;
    const base64 = await file.base64();
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'jpeg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

export function referencedImageUris(products: Product[], profile: Profile | null): string[] {
  const paths = new Set<string>();

  for (const product of products) {
    if (product.photoUri?.startsWith('file:')) paths.add(product.photoUri);
  }
  if (profile?.logoUri?.startsWith('file:')) paths.add(profile.logoUri);

  return [...paths];
}

export function assertBackupIsComplete(
  products: Product[],
  profile: Profile | null,
  images: BackupImageMap,
): void {
  const missing = referencedImageUris(products, profile).filter((uri) => !images[uri]);
  const invalid = Object.entries(images).filter(
    ([, value]) => !/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/.test(value),
  );

  if (missing.length > 0 || invalid.length > 0) {
    throw new Error(
      `Backup incompleto: ${missing.length} imagen(es) faltantes y ` +
      `${invalid.length} imagen(es) inválidas.`,
    );
  }
}

export async function collectBackupImages(
  products: Product[],
  profile: Profile | null,
): Promise<BackupImageMap> {
  const images: BackupImageMap = {};
  const paths = referencedImageUris(products, profile);
  const missing: string[] = [];

  for (const uri of paths) {
    const dataUri = await fileToBase64DataUri(uri);
    if (dataUri) {
      images[uri] = dataUri;
    } else {
      missing.push(uri);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `El backup no se creó porque faltan ${missing.length} imagen(es) referenciadas. ` +
      'Vuelve a seleccionar esas imágenes e inténtalo nuevamente.',
    );
  }

  assertBackupIsComplete(products, profile, images);
  return images;
}

export type RestoredImageMap = Record<string, string>;

export async function restoreBackupImages(
  images: BackupImageMap | undefined,
): Promise<RestoredImageMap> {
  if (!images || Object.keys(images).length === 0) return {};

  IMAGES_DIR.create({ idempotent: true, intermediates: true });
  const restored: RestoredImageMap = {};

  for (const [originalPath, dataUri] of Object.entries(images)) {
    try {
      if (!/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/.test(dataUri)) {
        throw new Error('Imagen Base64 inválida');
      }

      const originalFilename = originalPath.split(/[\\/]/).pop();
      const filename = originalFilename
        ? `restored_${Date.now()}_${restoredPathHash(originalPath)}_${originalFilename}`
        : undefined;
      if (!filename) continue;

      const dest = new File(IMAGES_DIR, filename);
      dest.create({ overwrite: true, intermediates: true });

      const base64Data = dataUri.replace(/^data:image\/[^;]+;base64,/, '');
      dest.write(base64Data, { encoding: 'base64' });

      if (!dest.exists || dest.size === 0) {
        throw new Error('La imagen restaurada quedó vacía');
      }
      restored[originalPath] = dest.uri;
    } catch (error) {
      throw new Error(
        `No se pudo restaurar la imagen "${originalPath}": ` +
        `${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }
  }

  return restored;
}

function restoredPathHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}
