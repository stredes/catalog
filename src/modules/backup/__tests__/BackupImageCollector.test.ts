import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeProduct, makeProfile } from '../../../__tests__/fakes';
import {
  collectBackupImages,
  missingImageUris,
  referencedImageUris,
} from '../infrastructure/services/BackupImageCollector';

const state = vi.hoisted(() => {
  const dirs = new Map<string, string[]>();
  const contents = new Map<string, string>();
  return { dirs, contents };
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
      return state.dirs.has(this.uri) || this.uri === 'file:///doc' || this.uri === 'file:///cache';
    }
    create() {}
    list(): Array<{ uri: string }> {
      return (state.dirs.get(this.uri) ?? []).map((name) => ({
        uri: `${this.uri}/${name}`,
      }));
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
    async base64(): Promise<string> {
      return state.contents.get(this.uri) ?? '';
    }
  }

  const Paths = { document: 'file:///doc', cache: 'file:///cache' };

  return { Directory: MockDirectory, File: MockFile, Paths };
});

const IMAGES_DIR = 'file:///doc/product-images';

beforeEach(() => {
  state.dirs.clear();
  state.contents.clear();
  legacyReads.readAsStringAsync.mockReset();
});

describe('referencedImageUris', () => {
  it('incluye URIs file: y content: de productos y logo', () => {
    const products = [
      makeProduct({ id: 'a', photoUri: 'file:///doc/product-images/a.jpg' }),
      makeProduct({ id: 'b', photoUri: 'content://media/foo.jpg' }),
      makeProduct({ id: 'c', photoUri: undefined }),
    ];
    const profile = makeProfile({ logoUri: 'file:///doc/product-images/logo.png' });

    const uris = referencedImageUris(products, profile);
    expect(uris).toEqual(
      expect.arrayContaining([
        'file:///doc/product-images/a.jpg',
        'content://media/foo.jpg',
        'file:///doc/product-images/logo.png',
      ]),
    );
  });

  it('omite data URIs ya embebidas', () => {
    const products = [makeProduct({ photoUri: 'data:image/jpeg;base64,AAAA' })];
    expect(referencedImageUris(products, null)).toEqual([]);
  });
});

describe('missingImageUris', () => {
  it('devuelve la URI de una foto referenciada que falta en el mapa', () => {
    const uri = 'file:///doc/product-images/gone.jpg';
    const missing = missingImageUris(
      [makeProduct({ photoUri: uri })],
      null,
      {},
    );

    expect(missing).toEqual([uri]);
  });

  it('devuelve [] cuando todas las imágenes están presentes', () => {
    const uri = 'file:///doc/product-images/present.jpg';
    const missing = missingImageUris(
      [makeProduct({ photoUri: uri })],
      makeProfile({ logoUri: 'file:///doc/product-images/logo.png' }),
      {
        [uri]: 'data:image/jpeg;base64,AAAA',
        'file:///doc/product-images/logo.png': 'data:image/png;base64,AAAA',
      },
    );

    expect(missing).toEqual([]);
  });

  it('no reporta un producto sin photoUri', () => {
    const missing = missingImageUris(
      [makeProduct({ photoUri: undefined })],
      null,
      {},
    );

    expect(missing).toEqual([]);
  });

  it('incluye el logo del perfil cuando falta', () => {
    const logoUri = 'file:///doc/product-images/logo.png';
    const missing = missingImageUris(
      [],
      makeProfile({ logoUri }),
      {},
    );

    expect(missing).toEqual([logoUri]);
  });

  it('no reporta data URIs ya embebidas', () => {
    const missing = missingImageUris(
      [makeProduct({ photoUri: 'data:image/jpeg;base64,AAAA' })],
      makeProfile({ logoUri: 'data:image/png;base64,BBBB' }),
      {},
    );

    expect(missing).toEqual([]);
  });
});

describe('collectBackupImages', () => {
  it('recolecta la imagen directa del producto', async () => {
    const uri = 'file:///doc/product-images/product_1.jpg';
    state.contents.set(uri, 'aGVsbG8=');

    const images = await collectBackupImages([makeProduct({ photoUri: uri })], null);

    expect(images[uri]).toBe('data:image/jpeg;base64,aGVsbG8=');
  });

  it('resuelve rutas obsoletas por nombre de archivo en product-images', async () => {
    const staleUri = 'file:///data/user/0/com.anonymous.catalogclean/files/product-images/product_1.jpg';
    state.dirs.set(IMAGES_DIR, ['product_1.jpg']);
    state.contents.set(`${IMAGES_DIR}/product_1.jpg`, 'aGVsbG8=');

    const images = await collectBackupImages([makeProduct({ photoUri: staleUri })], null);

    expect(images[staleUri]).toBe('data:image/jpeg;base64,aGVsbG8=');
  });

  it('usa mime png cuando la extensión es png', async () => {
    const uri = 'file:///doc/product-images/logo.png';
    state.contents.set(uri, 'aGVsbG8=');

    const images = await collectBackupImages([], makeProfile({ logoUri: uri }));

    expect(images[uri]).toBe('data:image/png;base64,aGVsbG8=');
  });

  it('omite imágenes faltantes sin bloquear el backup', async () => {
    const products = [
      makeProduct({
        id: 'p1',
        name: 'Audífonos',
        photoUri: 'file:///doc/product-images/missing.jpg',
      }),
      makeProduct({
        id: 'p2',
        name: 'Micrófono',
        photoUri: 'file:///doc/product-images/product_2.jpg',
      }),
    ];
    state.contents.set('file:///doc/product-images/product_2.jpg', 'aGVsbG8=');

    const images = await collectBackupImages(products, null);

    expect(images).not.toHaveProperty('file:///doc/product-images/missing.jpg');
    expect(images['file:///doc/product-images/product_2.jpg']).toBe(
      'data:image/jpeg;base64,aGVsbG8=',
    );
  });

  it('lee imágenes content:// (MediaStore) con la API legacy', async () => {
    const uri = 'content://media/external/images/media/777';
    legacyReads.readAsStringAsync.mockResolvedValueOnce('aGVsbG8=');

    const images = await collectBackupImages([makeProduct({ photoUri: uri })], null);

    expect(images[uri]).toBe('data:image/jpeg;base64,aGVsbG8=');
    expect(legacyReads.readAsStringAsync).toHaveBeenCalledWith(uri, { encoding: 'base64' });
  });

  it('no usa la API legacy para rutas file:// que ya resuelven', async () => {
    const uri = 'file:///doc/product-images/a.jpg';
    state.contents.set(uri, 'aGVsbG8=');

    const images = await collectBackupImages([makeProduct({ photoUri: uri })], null);

    expect(images[uri]).toBe('data:image/jpeg;base64,aGVsbG8=');
    expect(legacyReads.readAsStringAsync).not.toHaveBeenCalled();
  });

  it('omite el logo faltante sin bloquear el backup', async () => {
    const profile = makeProfile({ logoUri: 'file:///doc/product-images/gone.png' });

    const images = await collectBackupImages([], profile);

    expect(Object.keys(images)).toHaveLength(0);
  });
});
