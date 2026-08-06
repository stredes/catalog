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

function basenameOf(uri: string): string {
  const withoutQuery = uri.split('?')[0];
  const parts = withoutQuery.split(/[\\/]/);
  return parts[parts.length - 1] ?? withoutQuery;
}

export function resolveImageFile(uri: string): File | null {
  try {
    const direct = new File(uri);
    if (direct.exists) return direct;
  } catch {
    // La ruta puede ser inválida; seguir con el fallback.
  }

  // Fallback: buscar por nombre de archivo en el directorio persistente.
  // Cubre datos viejos cuyo photoUri apunta a rutas obsoletas (package
  // anterior, scheme faltante) pero cuyo archivo ya fue copiado aquí.
  try {
    if (IMAGES_DIR.exists) {
      const name = basenameOf(uri);
      for (const entry of IMAGES_DIR.list()) {
        if (basenameOf(entry.uri) === name) {
          const candidate = new File(entry.uri);
          if (candidate.exists) return candidate;
        }
      }
    }
  } catch {
    // Sin acceso al directorio: no hay fallback posible.
  }

  return null;
}

function mimeForUri(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpeg';
  return ext === 'png' ? 'image/png' : 'image/jpeg';
}

export async function readImageAsBase64(uri: string): Promise<string | null> {
  try {
    const file = resolveImageFile(uri);
    if (file) {
      const dataUri = await fileToBase64DataUri(file.uri);
      if (dataUri) return dataUri;
    }
  } catch {
    // Ruta ilegible con la API nueva; seguir con el fallback legacy.
  }

  // La API nueva de expo-file-system solo lee file://. Las fotos viejas pueden
  // apuntar a content:// (MediaStore), que React Native <Image> sí muestra pero
  // el File nuevo no puede leer. La API legacy (readAsStringAsync) sí soporta
  // content:// en Android, así que esas fotos entran al backup.
  try {
    if (/^content:/i.test(uri)) {
      const legacy = await import('expo-file-system/legacy');
      const base64 = await legacy.readAsStringAsync(uri, { encoding: 'base64' });
      if (!base64) return null;
      return `data:${mimeForUri(uri)};base64,${base64}`;
    }
  } catch {
    return null;
  }

  return null;
}

export function referencedImageUris(products: Product[], profile: Profile | null): string[] {
  const paths = new Set<string>();

  for (const product of products) {
    if (product.photoUri && !product.photoUri.startsWith('data:')) paths.add(product.photoUri);
  }
  if (profile?.logoUri && !profile.logoUri.startsWith('data:')) paths.add(profile.logoUri);

  return [...paths];
}

export function missingImageUris(
  products: Product[],
  profile: Profile | null,
  images: BackupImageMap,
): string[] {
  return referencedImageUris(products, profile).filter((uri) => !images[uri]);
}

export async function collectBackupImages(
  products: Product[],
  profile: Profile | null,
): Promise<BackupImageMap> {
  const images: BackupImageMap = {};

  for (const product of products) {
    if (!product.photoUri || product.photoUri.startsWith('data:')) continue;

    const dataUri = await readImageAsBase64(product.photoUri);
    if (dataUri) {
      images[product.photoUri] = dataUri;
    }
  }

  if (profile?.logoUri && !profile.logoUri.startsWith('data:')) {
    const dataUri = await readImageAsBase64(profile.logoUri);
    if (dataUri) {
      images[profile.logoUri] = dataUri;
    }
  }

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
