import { File } from 'expo-file-system';
import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { DATABASE_SCHEMA_VERSION } from '../../../../shared/infrastructure/schema-version';
import { restoreBackupImages } from './BackupImageCollector';
import { BackupImageMap } from '../../domain/entities/BackupSnapshot';

type LegacyBackupData = {
  version?: string;
  createdAt?: string;
  schemaVersion?: number;
  families?: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>;
  products?: Array<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>;
  catalogs?: Array<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; createdAt: string }>;
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
    format TEXT NOT NULL, productIds TEXT NOT NULL, pdfUri TEXT NOT NULL, createdAt TEXT NOT NULL
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
}

async function clearAllTables(db: Awaited<ReturnType<typeof getDatabase>>) {
  const tables = ['orders', 'catalogs', 'products', 'families', 'profile'];
  for (const table of tables) {
    try {
      await db.runAsync(`DELETE FROM ${table}`);
    } catch {
      // Table may not exist
    }
  }
}

export async function importBackupFromFile(filepath: string): Promise<{
  families: number;
  products: number;
  catalogs: number;
  orders: number;
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

  let data: LegacyBackupData;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('El archivo no es un backup válido (JSON inválido).');
  }

  if (!data.families && !data.products && !data.catalogs && !data.orders) {
    throw new Error('El archivo no contiene datos de backup reconocidos.');
  }

  const db = await getDatabase();
  let counts = { families: 0, products: 0, catalogs: 0, orders: 0, images: 0 };

  await ensureAllTablesExist(db);
  await clearAllTables(db);

  if (data.families?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const f of data.families!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
          f.id, f.name, f.createdAt, f.updatedAt,
        );
      }
    });
    counts.families = data.families.length;
  }

  if (data.products?.length) {
    const BATCH = 50;
    for (let i = 0; i < data.products.length; i += BATCH) {
      const batch = data.products.slice(i, i + BATCH);
      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const p of batch) {
          await txn.runAsync(
            'INSERT OR REPLACE INTO products (id, name, code, price, format, photoUri, familyId, stock, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            p.id, p.name, p.code, p.price, p.format, p.photoUri, p.familyId, p.stock, p.createdAt, p.updatedAt,
          );
        }
      });
    }
    counts.products = data.products.length;
  }

  if (data.catalogs?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const c of data.catalogs!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO catalogs (id, name, familyId, familyIds, format, productIds, pdfUri, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          c.id, c.name, c.familyId, c.familyIds, c.format, c.productIds, c.pdfUri, c.createdAt,
        );
      }
    });
    counts.catalogs = data.catalogs.length;
  }

  if (data.orders?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const o of data.orders!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO orders (id, orderNumber, clientName, items, subtotal, iva, total, status, paidAmount, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          o.id, o.orderNumber ?? 0, o.clientName, o.items, o.subtotal, o.iva, o.total,
          o.status ?? 'pending', o.paidAmount ?? (o.status === 'paid' ? o.total : 0), o.notes, o.createdAt,
        );
      }
    });
    counts.orders = data.orders.length;
  }

  if (data.profile?.length) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const p of data.profile!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO profile (id, businessName, ownerName, phone, email, address, website, logoUri, bankName, bankAccountType, bankAccountNumber, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          p.id, p.businessName, p.ownerName, p.phone, p.email, p.address, p.website, p.logoUri, p.bankName, p.bankAccountType, p.bankAccountNumber, p.updatedAt,
        );
      }
    });
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_SCHEMA_VERSION}`);

  counts.images = await restoreBackupImages(data.images);

  return counts;
}
