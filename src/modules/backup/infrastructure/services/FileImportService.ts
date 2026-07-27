import { File } from 'expo-file-system';
import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { DATABASE_SCHEMA_VERSION } from '../../../../shared/infrastructure/schema-version';
import { restoreBackupImages } from './BackupImageCollector';
import { BackupImageMap } from '../../domain/entities/BackupSnapshot';
import { validateBackupPayload } from '../../../../shared/validation/schemas';
import { SQLiteBackupRepository } from '../repositories/SQLiteBackupRepository';

type LegacyBackupData = {
  version?: string;
  createdAt?: string;
  schemaVersion?: number;
  families?: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>;
  products?: Array<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>;
  catalogs?: Array<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; purpose?: string | null; createdAt: string }>;
  profile?: Array<{ id: string; businessName: string; ownerName: string | null; phone: string | null; email: string | null; address: string | null; website: string | null; logoUri: string | null; bankName: string | null; bankAccountType: string | null; bankAccountNumber: string | null; updatedAt: string }>;
  orders?: Array<{ id: string; orderNumber: number; clientName: string; items: string; subtotal: number; iva: number; total: number; status?: string; paidAmount?: number; notes: string | null; createdAt: string }>;
  images?: BackupImageMap;
};

async function ensureAllTablesExist(db: Awaited<ReturnType<typeof getDatabase>>) {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, code TEXT, price REAL NOT NULL, format TEXT NOT NULL,
    photoUri TEXT, familyId TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
    FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS catalogs (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, familyId TEXT NOT NULL, familyIds TEXT,
    format TEXT NOT NULL, productIds TEXT NOT NULL, pdfUri TEXT NOT NULL, purpose TEXT, createdAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY NOT NULL, businessName TEXT NOT NULL, ownerName TEXT, phone TEXT, email TEXT,
    address TEXT, website TEXT, logoUri TEXT, bankName TEXT, bankAccountType TEXT, bankAccountNumber TEXT, updatedAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL, orderNumber INTEGER NOT NULL DEFAULT 0, clientName TEXT NOT NULL,
    items TEXT NOT NULL, subtotal REAL NOT NULL, iva REAL NOT NULL, total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', paidAmount REAL NOT NULL DEFAULT 0, notes TEXT, createdAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, phone TEXT, email TEXT, contactName TEXT, notes TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL
  )`);
}

async function clearAllTables(db: Awaited<ReturnType<typeof getDatabase>>) {
  await db.execAsync('PRAGMA foreign_keys = ON');
  const tables = ['orders', 'catalogs', 'products', 'families', 'profile', 'suppliers'];
  for (const table of tables) {
    try {
      await db.runAsync('DELETE FROM ' + table);
    } catch {
      // Table may not exist
    }
  }
}

async function checkSchemaVersion(db: Awaited<ReturnType<typeof getDatabase>>): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    return row?.user_version ?? 0;
  } catch {
    return 0;
  }
}

export async function importBackupFromFile(filepath: string): Promise<{
  families: number;
  products: number;
  catalogs: number;
  orders: number;
  suppliers: number;
  images: number;
}> {
  const file = new File(filepath);
  if (!file.exists) {
    throw new Error('El archivo de backup no existe.');
  }
  const content = await file.text();
  if (!content || content.trim().length === 0) {
    throw new Error('El archivo de backup está vacío.');
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error('El archivo no es un backup válido (JSON inválido).');
  }

  const currentBackup = validateBackupPayload(raw);
  if (currentBackup.success) {
    const payload = currentBackup.data;
    const restoredImages = await restoreBackupImages(payload.images);
    const products = payload.products.map((product) => ({
      ...product,
      photoUri: product.photoUri
        ? (restoredImages[product.photoUri] ?? product.photoUri)
        : undefined,
    }));
    const profile = payload.profile
      ? {
          ...payload.profile,
          logoUri: payload.profile.logoUri
            ? (restoredImages[payload.profile.logoUri] ?? payload.profile.logoUri)
            : undefined,
        }
      : null;

    await new SQLiteBackupRepository().transactionalRestore({
      families: payload.families,
      products,
      catalogs: payload.catalogs,
      profile,
      orders: payload.orders,
      suppliers: payload.suppliers,
    });

    return {
      families: payload.families.length,
      products: payload.products.length,
      catalogs: payload.catalogs.length,
      orders: payload.orders.length,
      suppliers: payload.suppliers.length,
      images: Object.keys(restoredImages).length,
    };
  }

  const data = raw as LegacyBackupData;
  if (!data.families && !data.products && !data.catalogs && !data.orders) {
    throw new Error('El archivo no contiene datos de backup reconocidos.');
  }

  const db = await getDatabase();

  const currentVersion = await checkSchemaVersion(db);
  if (currentVersion > DATABASE_SCHEMA_VERSION) {
    throw new Error(
      `La base de datos está en versión ${currentVersion}, pero la app soporta hasta ${DATABASE_SCHEMA_VERSION}. Actualiza la app.`
    );
  }

  let counts = { families: 0, products: 0, catalogs: 0, orders: 0, suppliers: 0, images: 0 };

  await ensureAllTablesExist(db);
  await clearAllTables(db);

  await db.execAsync('PRAGMA foreign_keys = ON');

  if (data.families?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync('PRAGMA foreign_keys = ON');
      for (const f of data.families!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
          f.id, f.name, f.createdAt, f.updatedAt,
        );
      }
    });
    counts.families = data.families.length;
  }

  const restoredImages = await restoreBackupImages(data.images);

  if (data.products?.length) {
    const BATCH = 50;
    for (let i = 0; i < data.products.length; i += BATCH) {
      const batch = data.products.slice(i, i + BATCH);
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync('PRAGMA foreign_keys = ON');
        for (const p of batch) {
          const photoUri = p.photoUri
            ? (restoredImages[p.photoUri] ?? p.photoUri)
            : null;
          await txn.runAsync(
            'INSERT OR REPLACE INTO products (id, name, code, price, format, photoUri, familyId, stock, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            p.id, p.name, p.code ?? null, p.price, p.format, photoUri, p.familyId, p.stock ?? 0, p.createdAt, p.updatedAt,
          );
        }
      });
    }
    counts.products = data.products.length;
  }

  if (data.catalogs?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync('PRAGMA foreign_keys = ON');
      for (const c of data.catalogs!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO catalogs (id, name, familyId, familyIds, format, productIds, pdfUri, purpose, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          c.id, c.name, c.familyId, c.familyIds ?? null, c.format, c.productIds, c.pdfUri, c.purpose ?? null, c.createdAt,
        );
      }
    });
    counts.catalogs = data.catalogs.length;
  }

  if (data.orders?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync('PRAGMA foreign_keys = ON');
      for (const o of data.orders!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO orders (id, orderNumber, clientName, items, subtotal, iva, total, status, paidAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          o.id, o.orderNumber ?? 0, o.clientName, o.items, o.subtotal, o.iva, o.total,
          o.status ?? 'pending', o.paidAmount ?? (o.status === 'paid' ? o.total : 0), o.notes ?? null, o.createdAt,
        );
      }
    });
    counts.orders = data.orders.length;
  }

  if (data.profile?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync('PRAGMA foreign_keys = ON');
      for (const p of data.profile!) {
        const logoUri = p.logoUri
          ? (restoredImages[p.logoUri] ?? p.logoUri)
          : null;
        await txn.runAsync(
          'INSERT OR REPLACE INTO profile (id, businessName, ownerName, phone, email, address, website, logoUri, bankName, bankAccountType, bankAccountNumber, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          p.id, p.businessName, p.ownerName ?? null, p.phone ?? null, p.email ?? null,
          p.address ?? null, p.website ?? null, logoUri, p.bankName ?? null,
          p.bankAccountType ?? null, p.bankAccountNumber ?? null, p.updatedAt,
        );
      }
    });
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_SCHEMA_VERSION}`);

  counts.images = Object.keys(restoredImages).length;

  return counts;
}