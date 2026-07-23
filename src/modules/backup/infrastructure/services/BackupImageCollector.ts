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

export async function collectBackupImages(
  products: Product[],
  profile: Profile | null,
): Promise<BackupImageMap> {
  const images: BackupImageMap = {};
  const paths = new Set<string>();

  for (const p of products) {
    if (p.photoUri && !p.photoUri.startsWith('data:') && p.photoUri.startsWith('file:')) {
      paths.add(p.photoUri);
    }
  }
  if (profile?.logoUri && !profile.logoUri.startsWith('data:') && profile.logoUri.startsWith('file:')) {
    paths.add(profile.logoUri);
  }

  for (const uri of paths) {
    const dataUri = await fileToBase64DataUri(uri);
    if (dataUri) {
      images[uri] = dataUri;
    }
  }

  return images;
}

export async function restoreBackupImages(images: BackupImageMap | undefined): Promise<number> {
  if (!images || Object.keys(images).length === 0) return 0;

  IMAGES_DIR.create({ idempotent: true, intermediates: true });
  let restored = 0;

  for (const [originalPath, dataUri] of Object.entries(images)) {
    try {
      const filename = originalPath.split('/').pop();
      if (!filename) continue;

      const dest = new File(IMAGES_DIR, filename);
      dest.create({ overwrite: true, intermediates: true });

      const base64Data = dataUri.replace(/^data:image\/[^;]+;base64,/, '');
      dest.write(base64Data);

      restored++;
    } catch {
      // Skip failed images
    }
  }

  return restored;
}
