import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeProduct, makeFamily } from '../../../__tests__/fakes';
import { BackupPayload } from '../domain/entities/BackupSnapshot';

const state = vi.hoisted(() => {
  const contents = new Map<string, string | Uint8Array>();
  return { contents };
});

const legacyReads = vi.hoisted(() => ({
  readAsStringAsync: vi.fn(),
}));

vi.mock('expo-file-system/legacy', () => legacyReads);

vi.mock('expo-file-system', () => {
  function buildUri(uris: unknown[]): string {
    return uris.reduce((acc: string, u: unknown) => {
      const part = typeof u === 'string' ? u : (u as { uri: string }).uri;
      if (!acc) return part;
      if (part.startsWith('file:')) return part;
      return acc.endsWith('/') ? acc + part : acc + '/' + part;
    }, '');
  }

  class MockDirectory {
    uri: string;
    constructor(...uris: unknown[]) {
      this.uri = buildUri(uris);
    }
    get exists() {
      return this.uri === 'file:///doc' || this.uri === 'file:///cache';
    }
    create() {}
    list(): Array<{ uri: string }> {
      return [];
    }
  }

  class MockFile {
    uri: string;
    constructor(...uris: unknown[]) {
      this.uri = buildUri(uris);
    }
    get exists() {
      return state.contents.has(this.uri);
    }
    get size() {
      const v = state.contents.get(this.uri);
      if (v === undefined) return 0;
      if (typeof v === 'string') return v.length;
      return v.length;
    }
    create() {}
    write(content: string | Uint8Array, _opts?: { encoding?: string }) {
      state.contents.set(this.uri, content);
    }
    async base64(): Promise<string> {
      const v = state.contents.get(this.uri);
      if (v === undefined) return '';
      if (typeof v === 'string') return v;
      let binary = '';
      for (let i = 0; i < v.length; i++) binary += String.fromCharCode(v[i]);
      return btoa(binary);
    }
    open() {
      return {
        readBytes: (length: number) => {
          const v = state.contents.get(this.uri);
          if (v === undefined) return new Uint8Array(0);
          if (typeof v === 'string') {
            return Uint8Array.from([...v.slice(0, length)].map((c) => c.charCodeAt(0)));
          }
          return v.slice(0, length);
        },
        close() {},
      };
    }
  }

  const Paths = { document: 'file:///doc', cache: 'file:///cache' };

  return { Directory: MockDirectory, File: MockFile, Paths };
});

import {
  createBackupArchive,
  extractBackupArchive,
  isZipBackup,
} from '../infrastructure/services/BackupArchiveService';

const IMAGE_BASE64 = btoa('FAKE-IMAGE-BYTES');

function makePayload(overrides: Partial<BackupPayload> = {}): BackupPayload {
  return {
    schemaVersion: 14,
    createdAt: '2026-01-01T00:00:00.000Z',
    families: [makeFamily({ id: 'fam_1' })],
    products: [makeProduct({
      id: 'prd_1',
      familyId: 'fam_1',
      photoUri: 'file:///doc/product-images/a.jpg',
    })],
    catalogs: [],
    profile: null,
    orders: [],
    suppliers: [],
    quotations: [],
    clients: [],
    invoices: [],
    purchaseDocuments: [],
    images: { 'file:///doc/product-images/a.jpg': `data:image/jpeg;base64,${IMAGE_BASE64}` },
    ...overrides,
  };
}

beforeEach(() => {
  state.contents.clear();
  state.contents.set('file:///doc/product-images/a.jpg', IMAGE_BASE64);
  legacyReads.readAsStringAsync.mockReset();
});

describe('isZipBackup', () => {
  it('detecta archivos .zip (mayúsculas incluidas)', async () => {
    await expect(isZipBackup('/tmp/Backup.ZIP')).resolves.toBe(true);
    await expect(isZipBackup('/tmp/Backup.json')).resolves.toBe(false);
  });

  it('detecta ZIP por magic bytes PK\\x03\\x04 aunque no tenga extensión .zip', async () => {
    const payload = makePayload();
    const archive = await createBackupArchive(payload, 'completo');
    const bytes = state.contents.get(archive.uri) as Uint8Array;
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);

    state.contents.set('file:///cache/renombrado.sin_ext', bytes);
    await expect(isZipBackup('file:///cache/renombrado.sin_ext')).resolves.toBe(true);
  });

  it('no detecta un JSON renombrado sin extensión como ZIP', async () => {
    state.contents.set('file:///cache/backup.json', JSON.stringify({ families: [] }));
    await expect(isZipBackup('file:///cache/backup.json')).resolves.toBe(false);
  });
});

describe('createBackupArchive', () => {
  it('genera un ZIP con backup.json + carpeta images/', async () => {
    const payload = makePayload();
    const archive = await createBackupArchive(payload, 'completo');

    expect(archive.fileName.endsWith('.zip')).toBe(true);
    expect(archive.imageCount).toBe(1);

    const zipBytes = state.contents.get(archive.uri) as Uint8Array;
    expect(zipBytes).toBeDefined();

    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBytes);
    expect(zip.file('backup.json')).toBeDefined();
    expect(zip.file('images/0_a.jpg')).toBeDefined();
  });

  it('no falla si falta una imagen referenciada sin respaldo: la omite y conserva los datos', async () => {
    state.contents.clear();
    const payload = makePayload({ images: {} });
    const archive = await createBackupArchive(payload, 'completo');

    expect(archive.imageCount).toBe(0);

    const zipBytes = state.contents.get(archive.uri) as Uint8Array;
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBytes);
    expect(zip.file('images/0_a.jpg')).toBeNull();

    const manifest = JSON.parse(await zip.file('backup.json')!.async('string'));
    expect(manifest.products).toHaveLength(1);
    expect(manifest.products[0].id).toBe('prd_1');
    expect(manifest.imageFiles).toEqual({});
  });

  it('incluye solo las imágenes existentes cuando alguna falta', async () => {
    state.contents.clear();
    state.contents.set('file:///doc/product-images/present.jpg', IMAGE_BASE64);
    const payload = makePayload({
      products: [
        makeProduct({ id: 'prd_1', photoUri: 'file:///doc/product-images/present.jpg' }),
        makeProduct({ id: 'prd_2', photoUri: 'file:///doc/product-images/missing.jpg' }),
      ],
    });

    const archive = await createBackupArchive(payload, 'completo');

    expect(archive.imageCount).toBe(1);
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(state.contents.get(archive.uri) as Uint8Array);
    expect(zip.file('images/0_present.jpg')).toBeDefined();
    expect(zip.file('images/1_missing.jpg')).toBeNull();
  });

  it('incluye imágenes content:// (MediaStore) en el ZIP', async () => {
    const contentUri = 'content://media/external/images/media/999';
    legacyReads.readAsStringAsync.mockResolvedValueOnce(IMAGE_BASE64);
    const payload = makePayload({
      products: [makeProduct({ id: 'prd_1', photoUri: contentUri })],
    });

    const archive = await createBackupArchive(payload, 'completo');

    expect(archive.imageCount).toBe(1);
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(state.contents.get(archive.uri) as Uint8Array);
    expect(zip.file('images/0_999')).toBeDefined();
    expect(legacyReads.readAsStringAsync).toHaveBeenCalledWith(contentUri, { encoding: 'base64' });
  });

  it('usa los data-uris del snapshot como respaldo cuando el archivo físico no se puede leer', async () => {
    state.contents.clear();
    const payload = makePayload({
      images: { 'file:///doc/product-images/a.jpg': `data:image/jpeg;base64,${IMAGE_BASE64}` },
    });
    const archive = await createBackupArchive(payload, 'completo');

    expect(archive.imageCount).toBe(1);
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(state.contents.get(archive.uri) as Uint8Array);
    expect(zip.file('images/0_a.jpg')).toBeDefined();
    const manifest = JSON.parse(await zip.file('backup.json')!.async('string'));
    expect(manifest.imageFiles['file:///doc/product-images/a.jpg']).toBe('0_a.jpg');
  });
});

describe('extractBackupArchive', () => {
  it('extrae manifest y restaura las imágenes a disco', async () => {
    const payload = makePayload();
    const archive = await createBackupArchive(payload, 'completo');

    const { payload: extracted, restoredImages } = await extractBackupArchive(archive.uri);

    expect(extracted.families).toHaveLength(1);
    expect(extracted.products[0].id).toBe('prd_1');
    expect(extracted.images).toEqual({});

    const restoredUri = restoredImages['file:///doc/product-images/a.jpg'];
    expect(restoredUri).toBeDefined();
    expect(restoredUri!.startsWith('file:///doc/product-images/restored_')).toBe(true);

    const stored = state.contents.get(restoredUri!);
    expect(stored).toBe(IMAGE_BASE64);
  });

  it('rechaza un ZIP sin backup.json', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('random.txt', 'hola');
    state.contents.set('file:///cache/not-a-backup.zip', await zip.generateAsync({ type: 'uint8array' }));

    await expect(extractBackupArchive('file:///cache/not-a-backup.zip')).rejects.toThrow('backup.json');
  });

  it('rechaza un ZIP con backup.json que no es JSON válido', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('backup.json', 'not-json{{{');
    state.contents.set('file:///cache/bad-json.zip', await zip.generateAsync({ type: 'uint8array' }));

    await expect(extractBackupArchive('file:///cache/bad-json.zip')).rejects.toThrow('inválido');
  });

  it('rechaza un manifest inválido ANTES de escribir imágenes a disco', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('backup.json', JSON.stringify({
      schemaVersion: 14,
      createdAt: '2026-01-01',
      families: [],
      products: [{ id: '', name: '', price: -5, format: 'unit', familyId: '', createdAt: '', updatedAt: '' }],
      catalogs: [],
      profile: null,
      orders: [],
      images: {},
      imageFiles: { 'file:///x/a.jpg': '0_a.jpg' },
    }));
    zip.file('images/0_a.jpg', 'DATA');
    state.contents.set('file:///cache/invalid.zip', await zip.generateAsync({ type: 'uint8array' }));

    await expect(extractBackupArchive('file:///cache/invalid.zip')).rejects.toThrow('inválido');

    const written = [...state.contents.keys()];
    expect(written.some((k) => k.includes('product-images/restored_'))).toBe(false);
  });

  it('rechaza un ZIP que declara imágenes que no existen dentro del archivo', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('backup.json', JSON.stringify({
      ...makePayload(),
      images: {},
      imageFiles: { 'file:///doc/product-images/a.jpg': '0_a.jpg' },
    }));
    state.contents.set('file:///cache/missing-image.zip', await zip.generateAsync({ type: 'uint8array' }));

    await expect(extractBackupArchive('file:///cache/missing-image.zip')).rejects.toThrow('incompleto');
  });

  it('sanitiza nombres de imagen (zip-slip) y no escapa de product-images', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('backup.json', JSON.stringify({
      ...makePayload(),
      images: {},
      imageFiles: { 'file:///evil/a.jpg': '../../../../evil.jpg' },
    }));
    zip.file('images/evil.jpg', 'EVIL');
    state.contents.set('file:///cache/evil.zip', await zip.generateAsync({ type: 'uint8array' }));

    const { restoredImages } = await extractBackupArchive('file:///cache/evil.zip');

    const uri = restoredImages['file:///evil/a.jpg'];
    expect(uri).toBeDefined();
    expect(uri).toContain('product-images/restored_');
    expect(uri).not.toContain('..');
    expect(uri).toContain('evil.jpg');
  });

  it('no escribe imágenes cuando se solicita writeImages: false', async () => {
    const payload = makePayload();
    const archive = await createBackupArchive(payload, 'completo');
    const before = new Set(state.contents.keys());

    const { restoredImages } = await extractBackupArchive(archive.uri, { writeImages: false });

    expect(Object.keys(restoredImages)).toHaveLength(0);
    const after = new Set(state.contents.keys());
    const written = [...after].filter((k) => !before.has(k));
    expect(written.some((k) => k.includes('product-images/restored_'))).toBe(false);
  });
});
