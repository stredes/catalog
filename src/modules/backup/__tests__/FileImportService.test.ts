import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeProduct, makeFamily } from '../../../__tests__/fakes';
import { BackupPayload } from '../domain/entities/BackupSnapshot';

const state = vi.hoisted(() => {
  const contents = new Map<string, string | Uint8Array>();
  return {
    contents,
    execCalls: [] as string[],
    transactionalRestore: vi.fn(async (_data: any) => {}),
  };
});

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
    async text(): Promise<string> {
      const v = state.contents.get(this.uri);
      if (v === undefined) return '';
      if (typeof v === 'string') return v;
      let binary = '';
      for (let i = 0; i < v.length; i++) binary += String.fromCharCode(v[i]);
      return binary;
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

vi.mock('../../../shared/infrastructure/sqlite', () => ({
  getDatabase: vi.fn(async () => ({
    execAsync: async (sql: string) => {
      state.execCalls.push(sql);
    },
    runAsync: async () => {},
    getFirstAsync: async () => ({ user_version: 0 }),
    getAllAsync: async () => [],
    withExclusiveTransactionAsync: async (fn: (txn: { runAsync: () => Promise<void>; execAsync: () => Promise<void> }) => Promise<void>) => {
      await fn({ runAsync: async () => {}, execAsync: async () => {} });
    },
  })),
}));

vi.mock('../infrastructure/repositories/SQLiteBackupRepository', () => ({
  SQLiteBackupRepository: class {
    transactionalRestore = state.transactionalRestore;
  },
}));

import {
  importBackupFromFile,
  previewBackupFromFile,
} from '../infrastructure/services/FileImportService';
import { createBackupArchive } from '../infrastructure/services/BackupArchiveService';

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
    images: { 'file:///doc/product-images/a.jpg': `data:image/jpeg;base64,${IMAGE_BASE64}` },
    ...overrides,
  };
}

beforeEach(() => {
  state.contents.clear();
  state.execCalls.length = 0;
  state.transactionalRestore.mockClear();
  state.contents.set('file:///doc/product-images/a.jpg', IMAGE_BASE64);
});

describe('importBackupFromFile - path ZIP', () => {
  it('importa un ZIP: extrae, valida y restaura en la base de datos', async () => {
    const archive = await createBackupArchive(makePayload(), 'completo');

    const result = await importBackupFromFile(archive.uri);

    expect(result.families).toBe(1);
    expect(result.products).toBe(1);
    expect(result.images).toBe(1);
    expect(state.transactionalRestore).toHaveBeenCalledTimes(1);
    const restoreCall = state.transactionalRestore.mock.calls[0][0];
    expect(restoreCall.products[0].photoUri).toContain('product-images/restored_');
    expect(restoreCall.products[0].photoUri).not.toBe('file:///doc/product-images/a.jpg');
  });

  it('detecta un ZIP renombrado sin extensión por sus magic bytes', async () => {
    const archive = await createBackupArchive(makePayload(), 'completo');
    const bytes = state.contents.get(archive.uri) as Uint8Array;
    state.contents.set('file:///cache/renombrado', bytes);

    const result = await importBackupFromFile('file:///cache/renombrado');

    expect(result.products).toBe(1);
    expect(state.transactionalRestore).toHaveBeenCalledTimes(1);
  });

  it('rechaza un ZIP sin backup.json', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('random.txt', 'hola');
    state.contents.set('file:///cache/not-backup.zip', await zip.generateAsync({ type: 'uint8array' }));

    await expect(importBackupFromFile('file:///cache/not-backup.zip')).rejects.toThrow('backup.json');
    expect(state.transactionalRestore).not.toHaveBeenCalled();
  });
});

describe('previewBackupFromFile - path ZIP', () => {
  it('previsualiza un ZIP sin escribir imágenes ni tocar la base de datos', async () => {
    const archive = await createBackupArchive(makePayload(), 'completo');

    const preview = await previewBackupFromFile(archive.uri);

    expect(preview.families).toBe(1);
    expect(preview.products).toBe(1);
    expect(preview.images).toBe(1);
    expect(preview.quotations).toBe(0);
    expect(preview.clients).toBe(0);
    expect(state.transactionalRestore).not.toHaveBeenCalled();

    const written = [...state.contents.keys()];
    expect(written.some((k) => k.includes('product-images/restored_'))).toBe(false);
  });

  it('reporta cotizaciones y clientes si el backup los incluye', async () => {
    const archive = await createBackupArchive(makePayload({
      quotations: [{
        id: 'q_1',
        quotationNumber: 1,
        clientName: 'Cliente',
        items: [],
        subtotal: 0,
        ivaRate: 0,
        ivaAmount: 0,
        total: 0,
        status: 'pending',
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      clients: [{
        id: 'cli_1',
        name: 'Juan',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
    }), 'completo');

    const preview = await previewBackupFromFile(archive.uri);

    expect(preview.quotations).toBe(1);
    expect(preview.clients).toBe(1);
  });
});

describe('importBackupFromFile - legacy JSON', () => {
  it('sigue soportando el flujo JSON legacy', async () => {
    const legacy = JSON.stringify({
      families: [makeFamily({ id: 'fam_1' })],
      products: [makeProduct({ id: 'prd_1', familyId: 'fam_1', photoUri: undefined })],
      catalogs: [],
      profile: [{
        id: 'profile',
        businessName: 'Mi Marca',
        ownerName: null,
        phone: null,
        email: null,
        address: null,
        website: null,
        logoUri: null,
        bankName: null,
        bankAccountType: null,
        bankAccountNumber: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }],
      orders: [],
    });
    state.contents.set('file:///cache/legacy.json', legacy);

    const result = await importBackupFromFile('file:///cache/legacy.json');

    expect(result.families).toBe(1);
    expect(result.products).toBe(1);
    expect(state.execCalls.some((s) => s.includes('CREATE TABLE IF NOT EXISTS families'))).toBe(true);
  });
});
