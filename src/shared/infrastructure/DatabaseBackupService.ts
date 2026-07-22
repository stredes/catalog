import { Directory, File, Paths } from 'expo-file-system';
import { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_SCHEMA_VERSION, getDatabase } from './sqlite';

const BACKUP_DIR = new Directory(Paths.document, 'backups');
const IMAGES_DIR = new Directory(Paths.document, 'product-images');

type BackupData = {
  version: string;
  createdAt: string;
  schemaVersion: number;
  families: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>;
  products: Array<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>;
  catalogs: Array<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; createdAt: string }>;
  profile: Array<{ id: string; businessName: string; ownerName: string | null; phone: string | null; email: string | null; address: string | null; website: string | null; logoUri: string | null; bankName: string | null; bankAccountType: string | null; bankAccountNumber: string | null; updatedAt: string }>;
  orders: Array<{ id: string; orderNumber: number; clientName: string; items: string; subtotal: number; iva: number; total: number; notes: string | null; createdAt: string }>;
  schemaMigrations: Array<{ version: number; appliedAt: string }>;
  images: Record<string, string>;
};

function ensureBackupDir() {
  BACKUP_DIR.create({ idempotent: true, intermediates: true });
}

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

async function collectImages(
  products: Array<{ photoUri: string | null }>,
  profile: Array<{ logoUri: string | null }>,
): Promise<Record<string, string>> {
  const images: Record<string, string> = {};
  const paths = new Set<string>();

  for (const p of products) {
    if (p.photoUri && !p.photoUri.startsWith('data:') && p.photoUri.startsWith('file:')) {
      paths.add(p.photoUri);
    }
  }
  for (const p of profile) {
    if (p.logoUri && !p.logoUri.startsWith('data:') && p.logoUri.startsWith('file:')) {
      paths.add(p.logoUri);
    }
  }

  for (const uri of paths) {
    const dataUri = await fileToBase64DataUri(uri);
    if (dataUri) {
      images[uri] = dataUri;
    }
  }

  return images;
}

async function exportData(db: SQLiteDatabase): Promise<BackupData> {
  const [families, products, catalogs, profile, orders, schemaMigrations, versionRow] = await Promise.all([
    db.getAllAsync<{ id: string; name: string; createdAt: string; updatedAt: string }>('SELECT * FROM families'),
    db.getAllAsync<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>('SELECT * FROM products'),
    db.getAllAsync<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; createdAt: string }>('SELECT * FROM catalogs'),
    db.getAllAsync<{ id: string; businessName: string; ownerName: string | null; phone: string | null; email: string | null; address: string | null; website: string | null; logoUri: string | null; bankName: string | null; bankAccountType: string | null; bankAccountNumber: string | null; updatedAt: string }>('SELECT * FROM profile'),
    db.getAllAsync<{ id: string; orderNumber: number; clientName: string; items: string; subtotal: number; iva: number; total: number; notes: string | null; createdAt: string }>('SELECT * FROM orders'),
    db.getAllAsync<{ version: number; appliedAt: string }>('SELECT * FROM schema_migrations ORDER BY version'),
    db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
  ]);

  const images = await collectImages(products, profile);

  return {
    version: '3.1.8',
    createdAt: new Date().toISOString(),
    schemaVersion: versionRow?.user_version ?? 0,
    families,
    products,
    catalogs,
    profile,
    orders,
    schemaMigrations,
    images,
  };
}

export async function createBackup(): Promise<string> {
  const db = await getDatabase();
  ensureBackupDir();

  const data = await exportData(db);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup_${timestamp}.json`;
  const file = new File(BACKUP_DIR, filename);

  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify(data, null, 2));

  return file.uri;
}

export async function getBackupList(): Promise<Array<{ name: string; path: string; size: number; createdAt: string }>> {
  ensureBackupDir();
  const entries = BACKUP_DIR.list();
  const backups: Array<{ name: string; path: string; size: number; createdAt: string }> = [];

  for (const entry of entries) {
    if (!entry.uri.endsWith('.json')) continue;
    const file = new File(entry.uri);
    const info = file.info();
    if (info.exists) {
      backups.push({
        name: file.name,
        path: file.uri,
        size: info.size ?? 0,
        createdAt: new Date(info.modificationTime ?? Date.now()).toISOString(),
      });
    }
  }

  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function restoreImages(images: Record<string, string> | undefined): Promise<number> {
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

async function ensureAllTablesExist(db: SQLiteDatabase) {
  await db.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    appliedAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    price REAL NOT NULL,
    format TEXT NOT NULL,
    photoUri TEXT,
    familyId TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS catalogs (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    familyId TEXT NOT NULL,
    familyIds TEXT,
    format TEXT NOT NULL,
    productIds TEXT NOT NULL,
    pdfUri TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY NOT NULL,
    businessName TEXT NOT NULL,
    ownerName TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    website TEXT,
    logoUri TEXT,
    bankName TEXT,
    bankAccountType TEXT,
    bankAccountNumber TEXT,
    updatedAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY NOT NULL,
    clientName TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    notes TEXT,
    createdAt TEXT NOT NULL,
    orderNumber INTEGER NOT NULL DEFAULT 0
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS backup_snapshots (
    id TEXT PRIMARY KEY NOT NULL,
    label TEXT NOT NULL,
    trigger TEXT NOT NULL,
    familiesCount INTEGER NOT NULL,
    productsCount INTEGER NOT NULL,
    catalogsCount INTEGER NOT NULL,
    hasProfile INTEGER NOT NULL,
    checksum TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS backup_payloads (
    snapshotId TEXT PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL,
    FOREIGN KEY (snapshotId) REFERENCES backup_snapshots(id) ON DELETE CASCADE
  )`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    properties TEXT,
    createdAt TEXT NOT NULL
  )`);
}

async function clearAllTables(db: SQLiteDatabase) {
  const tables = [
    'backup_payloads',
    'backup_snapshots',
    'analytics_events',
    'schema_migrations',
    'orders',
    'catalogs',
    'products',
    'families',
    'profile',
  ];
  for (const table of tables) {
    try {
      await db.runAsync(`DELETE FROM ${table}`);
    } catch {
      // Table may not exist in older schemas, ignore
    }
  }
}

async function insertFamilies(db: SQLiteDatabase, families: BackupData['families']) {
  if (families.length === 0) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const f of families) {
      await txn.runAsync(
        'INSERT OR REPLACE INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        f.id, f.name, f.createdAt, f.updatedAt,
      );
    }
  });
}

async function insertProducts(db: SQLiteDatabase, products: BackupData['products']) {
  if (products.length === 0) return;
  const BATCH = 50;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const p of batch) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO products (id, name, code, price, format, photoUri, familyId, stock, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          p.id, p.name, p.code, p.price, p.format, p.photoUri, p.familyId, p.stock, p.createdAt, p.updatedAt,
        );
      }
    });
  }
}

async function insertCatalogs(db: SQLiteDatabase, catalogs: BackupData['catalogs']) {
  if (catalogs.length === 0) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const c of catalogs) {
      await txn.runAsync(
        'INSERT OR REPLACE INTO catalogs (id, name, familyId, familyIds, format, productIds, pdfUri, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        c.id, c.name, c.familyId, c.familyIds, c.format, c.productIds, c.pdfUri, c.createdAt,
      );
    }
  });
}

async function insertOrders(db: SQLiteDatabase, orders: BackupData['orders']) {
  if (orders.length === 0) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const o of orders) {
      await txn.runAsync(
        'INSERT OR REPLACE INTO orders (id, orderNumber, clientName, items, subtotal, iva, total, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        o.id, (o as any).orderNumber ?? 0, o.clientName, o.items, o.subtotal, o.iva, o.total, o.notes, o.createdAt,
      );
    }
  });
}

async function insertProfile(db: SQLiteDatabase, profile: BackupData['profile']) {
  if (profile.length === 0) return;
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const p of profile) {
      await txn.runAsync(
        'INSERT OR REPLACE INTO profile (id, businessName, ownerName, phone, email, address, website, logoUri, bankName, bankAccountType, bankAccountNumber, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p.id, p.businessName, p.ownerName, p.phone, p.email, p.address, p.website, p.logoUri, p.bankName, p.bankAccountType, p.bankAccountNumber, p.updatedAt,
      );
    }
  });
}

export async function restoreBackup(filepath: string): Promise<{ families: number; products: number; catalogs: number; orders: number; images: number }> {
  const file = new File(filepath);
  if (!file.exists) {
    throw new Error('El archivo de backup no existe.');
  }
  const content = await file.text();
  if (!content || content.trim().length === 0) {
    throw new Error('El archivo de backup está vacío.');
  }

  let data: BackupData;
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
    await insertFamilies(db, data.families);
    counts.families = data.families.length;
  }

  if (data.products?.length) {
    await insertProducts(db, data.products);
    counts.products = data.products.length;
  }

  if (data.catalogs?.length) {
    await insertCatalogs(db, data.catalogs);
    counts.catalogs = data.catalogs.length;
  }

  if (data.orders?.length) {
    await insertOrders(db, data.orders);
    counts.orders = data.orders.length;
  }

  if (data.profile?.length) {
    await insertProfile(db, data.profile);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_SCHEMA_VERSION}`);

  counts.images = await restoreImages(data.images);

  return counts;
}

export async function deleteBackup(filepath: string): Promise<void> {
  const file = new File(filepath);
  if (file.info().exists) {
    file.delete();
  }
}
