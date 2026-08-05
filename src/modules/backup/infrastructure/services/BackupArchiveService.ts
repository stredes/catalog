import JSZip from 'jszip';
import { Directory, File, Paths } from 'expo-file-system';
import { BackupImageMap, BackupPayload } from '../../domain/entities/BackupSnapshot';
import { readImageAsBase64, referencedImageUris } from './BackupImageCollector';
import { validateBackupPayload } from '../../../../shared/validation/schemas';

const IMAGES_DIR = new Directory(Paths.document, 'product-images');

function archiveImageName(uri: string, index: number): string {
  const rawName = uri.split('?')[0].split(/[\\/]/).pop() || '';
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || `image_${index}`;
  return `${index}_${safeName}`;
}

function sanitizeArchiveImageName(name: string): string | null {
  if (!name) return null;
  const base = name.replace(/\\/g, '/').split('/').pop() ?? '';
  const safe = base
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^_+|_+$/g, '');
  return safe.length > 0 ? safe : null;
}

export type BackupArchiveExport = {
  uri: string;
  fileName: string;
  imageCount: number;
};

export async function isZipBackup(filepath: string): Promise<boolean> {
  if (filepath.toLowerCase().endsWith('.zip')) return true;
  try {
    const file = new File(filepath);
    if (!file.exists) return false;
    const handle = file.open();
    try {
      const head = handle.readBytes(4);
      return (
        head.length === 4 &&
        head[0] === 0x50 &&
        head[1] === 0x4b &&
        head[2] === 0x03 &&
        head[3] === 0x04
      );
    } finally {
      handle.close();
    }
  } catch {
    return false;
  }
}

export async function createBackupArchive(
  payload: BackupPayload,
  label: string,
): Promise<BackupArchiveExport> {
  const zip = new JSZip();

  const uris = referencedImageUris(payload.products, payload.profile);
  const imageFiles: Record<string, string> = {};
  const storedImages = payload.images ?? {};

  let index = 0;
  for (const uri of uris) {
    let dataUri = await readImageAsBase64(uri);
    if (!dataUri) {
      // El archivo físico no se puede leer (ruta obsoleta, archivo perdido o
      // snapshot creado antes de reasignar las imágenes). El snapshot guarda
      // los data-uris de respaldo en payload.images: úsalos como fallback para
      // que el backup exportado no pierda las imágenes.
      dataUri = storedImages[uri] ?? null;
    }
    if (!dataUri) continue;
    const name = archiveImageName(uri, index);
    const base64 = dataUri.replace(/^data:image\/[^;]+;base64,/, '');
    zip.file(`images/${name}`, base64, { base64: true });
    imageFiles[uri] = name;
    index++;
  }

  const manifest = {
    ...payload,
    images: {} as BackupImageMap,
    imageFiles,
  };

  zip.file('backup.json', JSON.stringify(manifest));

  const exportDir = new Directory(Paths.cache, 'backup_export');
  exportDir.create({ idempotent: true, intermediates: true });

  const safeLabel = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48) || 'completo';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `CatalogClean_${safeLabel}_${timestamp}.zip`;

  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
  const out = new File(exportDir, fileName);
  out.create({ overwrite: true, intermediates: true });
  out.write(bytes);

  return { uri: out.uri, fileName, imageCount: index };
}

export async function extractBackupArchive(
  filepath: string,
  options: { writeImages?: boolean } = {},
): Promise<{
  payload: BackupPayload;
  restoredImages: BackupImageMap;
}> {
  const { writeImages = true } = options;
  const file = new File(filepath);
  if (!file.exists) {
    throw new Error('El archivo de backup no existe.');
  }

  const zip = await JSZip.loadAsync(await file.base64(), { base64: true });

  const manifestEntry = zip.file('backup.json');
  if (!manifestEntry) {
    throw new Error('El archivo ZIP no contiene un backup válido (falta backup.json).');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await manifestEntry.async('string'));
  } catch {
    throw new Error('El archivo ZIP no contiene un backup válido (backup.json inválido).');
  }

  const manifest = raw as Partial<BackupPayload> & {
    imageFiles?: Record<string, string>;
  };

  const validation = validateBackupPayload(manifest);
  if (!validation.success) {
    throw new Error(
      'El archivo ZIP contiene un backup inválido: ' +
      validation.errors.slice(0, 3).map((e) => `[${e.path}] ${e.message}`).join('; '),
    );
  }

  const imageFiles = manifest.imageFiles ?? {};

  const sanitized = new Map<string, string | null>();
  for (const [uri, rawName] of Object.entries(imageFiles)) {
    sanitized.set(uri, sanitizeArchiveImageName(rawName));
  }

  for (const [uri, name] of sanitized) {
    if (!name) continue;
    if (!zip.file(`images/${name}`)) {
      throw new Error(`El archivo ZIP está incompleto: falta la imagen "${name}" (${uri}).`);
    }
  }

  const restoredImages: BackupImageMap = {};

  if (writeImages) {
    IMAGES_DIR.create({ idempotent: true, intermediates: true });
    for (const [uri, name] of sanitized) {
      if (!name) continue;
      const entry = zip.file(`images/${name}`)!;
      const base64 = await entry.async('base64');
      const dest = new File(IMAGES_DIR, `restored_${Date.now()}_${name}`);
      dest.create({ overwrite: true, intermediates: true });
      dest.write(base64, { encoding: 'base64' });
      if (dest.exists && dest.size > 0) {
        restoredImages[uri] = dest.uri;
      }
    }
  }

  return {
    payload: validation.data as BackupPayload,
    restoredImages,
  };
}
