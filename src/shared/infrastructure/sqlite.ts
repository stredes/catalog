import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';
import { DATABASE_SCHEMA_VERSION } from './schema-version';
import { RECORD_HISTORY_DDL } from '../../modules/invoices/infrastructure/services/RecordHistorySql';

export { DATABASE_SCHEMA_VERSION };

let database: SQLiteDatabase | null = null;
let databasePromise: Promise<SQLiteDatabase> | null = null;

type DatabaseVersionRow = {
  user_version: number;
};

type ColumnInfo = {
  name: string;
};

const DATABASE_NAME = 'catalog.db';
const BACKUP_DIR = new Directory(Paths.document, 'backups');

const migrations: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      appliedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      format TEXT NOT NULL,
      photoUri TEXT,
      familyId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS catalogs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      familyId TEXT NOT NULL,
      format TEXT NOT NULL,
      productIds TEXT NOT NULL,
      pdfUri TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,
  ],
  2: [
    `CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY NOT NULL,
      businessName TEXT NOT NULL,
      ownerName TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      website TEXT,
      logoUri TEXT,
      updatedAt TEXT NOT NULL
    )`,
  ],
  3: [`ALTER TABLE catalogs ADD COLUMN familyIds TEXT`],
  4: [`ALTER TABLE products ADD COLUMN code TEXT`],
  5: [
    `ALTER TABLE profile ADD COLUMN bankName TEXT`,
    `ALTER TABLE profile ADD COLUMN bankAccountType TEXT`,
    `ALTER TABLE profile ADD COLUMN bankAccountNumber TEXT`,
  ],
  6: [`ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0`],
  7: [
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY NOT NULL,
      clientName TEXT NOT NULL,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      iva REAL NOT NULL,
      total REAL NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL
    )`,
  ],
  8: [
    `CREATE TABLE IF NOT EXISTS backup_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      trigger TEXT NOT NULL,
      familiesCount INTEGER NOT NULL,
      productsCount INTEGER NOT NULL,
      catalogsCount INTEGER NOT NULL,
      hasProfile INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS backup_payloads (
      snapshotId TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      FOREIGN KEY (snapshotId) REFERENCES backup_snapshots(id) ON DELETE CASCADE
    )`,
  ],
  9: [
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      properties TEXT,
      createdAt TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(name)`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(createdAt)`,
  ],
  10: [`ALTER TABLE orders ADD COLUMN orderNumber INTEGER NOT NULL DEFAULT 0`],
  11: [`ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'`],
  12: [
    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      contactName TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `ALTER TABLE products ADD COLUMN supplierId TEXT`,
  ],
  13: [`ALTER TABLE orders ADD COLUMN paidAmount REAL NOT NULL DEFAULT 0`],
  14: [
    `ALTER TABLE backup_snapshots ADD COLUMN ordersCount INTEGER NOT NULL DEFAULT 0`,
    `UPDATE orders SET orderNumber = (SELECT COUNT(*) FROM orders o2 WHERE o2.createdAt < orders.createdAt OR (o2.createdAt = orders.createdAt AND o2.rowid < orders.rowid)) + 1 WHERE orderNumber IN (SELECT orderNumber FROM orders GROUP BY orderNumber HAVING COUNT(*) > 1)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_orderNumber ON orders(orderNumber) WHERE orderNumber > 0`,
  ],
  15: [`ALTER TABLE backup_snapshots ADD COLUMN suppliersCount INTEGER NOT NULL DEFAULT 0`],
  16: [`ALTER TABLE catalogs ADD COLUMN purpose TEXT`],
  17: [
    `CREATE INDEX IF NOT EXISTS idx_products_familyId ON products(familyId)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
    `CREATE INDEX IF NOT EXISTS idx_catalogs_purpose ON catalogs(purpose)`,
  ],
  18: [
    `CREATE INDEX IF NOT EXISTS idx_products_supplierId ON products(supplierId)`,
    `CREATE INDEX IF NOT EXISTS idx_backup_snapshots_createdAt ON backup_snapshots(createdAt)`,
    `CREATE INDEX IF NOT EXISTS idx_backup_payloads_snapshotId ON backup_payloads(snapshotId)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_clientName ON orders(clientName)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt)`,
  ],
  19: [
    `CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY NOT NULL,
      quotationNumber INTEGER NOT NULL,
      clientName TEXT NOT NULL,
      clientPhone TEXT,
      clientEmail TEXT,
      clientAddress TEXT,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL,
      ivaRate REAL NOT NULL DEFAULT 19,
      ivaAmount REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      validUntil TEXT,
      createdAt TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_quotationNumber ON quotations(quotationNumber) WHERE quotationNumber > 0`,
    `CREATE INDEX IF NOT EXISTS idx_quotations_clientName ON quotations(clientName)`,
    `CREATE INDEX IF NOT EXISTS idx_quotations_createdAt ON quotations(createdAt)`,
  ],
  20: [
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      rut TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)`,
    `CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut)`,
  ],
  21: [`ALTER TABLE orders ADD COLUMN clientId TEXT`],
  22: [`ALTER TABLE quotations ADD COLUMN clientRut TEXT`],
  23: [
    `UPDATE quotations SET status = 'pending' WHERE status = 'draft' OR status = 'sent'`,
    `CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status)`,
  ],
  24: [
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_number TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      client_name TEXT NOT NULL,
      description TEXT,
      net_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_name)`,
    `CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`,
    `ALTER TABLE backup_snapshots ADD COLUMN invoicesCount INTEGER NOT NULL DEFAULT 0`,
    RECORD_HISTORY_DDL,
  ],
}

async function columnExists(db: SQLiteDatabase, table: string, column: string): Promise<boolean> {
  try {
    const rows = await db.getAllAsync<ColumnInfo>(`PRAGMA table_info(${table})`);
    return rows.some((r) => r.name === column);
  } catch {
    return false;
  }
}

async function tableExists(db: SQLiteDatabase, table: string): Promise<boolean> {
  try {
    const row = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=?`,
      table,
    );
    return (row?.cnt ?? 0) > 0;
  } catch {
    return false;
  }
}

async function safeExecAsync(db: SQLiteDatabase, sql: string) {
  if (!db) return;
  if (!sql || typeof sql !== 'string' || sql.trim().length === 0) return;
  await db.execAsync(sql);
}

async function getCurrentSchemaVersion(db: SQLiteDatabase): Promise<number> {
  try {
    const row = await db.getFirstAsync<DatabaseVersionRow>('PRAGMA user_version');
    return row?.user_version ?? 0;
  } catch {
    return 0;
  }
}

async function setSchemaVersion(db: SQLiteDatabase, version: number) {
  try {
    await db.execAsync(`PRAGMA user_version = ${version}`);
  } catch {
    // PRAGMA may fail inside some contexts, ignore
  }
}

async function applyMigration(db: SQLiteDatabase, version: number) {
  const statements = migrations[version];

  if (!statements || statements.length === 0) {
    return;
  }

  for (const sql of statements) {
    const trimmed = sql.trim();
    if (!trimmed) continue;

    const upperTrimmed = trimmed.toUpperCase();

    if (upperTrimmed.startsWith('ALTER TABLE')) {
      const match = trimmed.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
      if (match) {
        const exists = await columnExists(db, match[1], match[2]);
        if (exists) continue;
      }
    }

    try {
      await db.execAsync(trimmed);
    } catch (error) {
      if (upperTrimmed.startsWith('ALTER TABLE')) {
        const match = trimmed.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)/i);
        if (match) {
          const exists = await columnExists(db, match[1], match[2]);
          if (exists) continue;
        }
        throw new Error(stepLabel(`MIGRATE-${version}`, `Migration v${version} failed: ${trimmed.slice(0, 80)}`));
      }
      if (upperTrimmed.startsWith('CREATE INDEX')) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('already exists')) continue;
        console.warn(`Migration v${version} CREATE INDEX warning: ${msg}`);
        continue;
      }
      throw new Error(stepLabel(`MIGRATE-${version}`, `Migration v${version} failed: ${trimmed.slice(0, 80)}`));
    }
  }

  try {
    await db.runAsync(
      'INSERT OR IGNORE INTO schema_migrations (version, appliedAt) VALUES (?, ?)',
      version,
      new Date().toISOString(),
    );
  } catch {
    // Ignore
  }

  await setSchemaVersion(db, version);
}

async function migrateDatabase(db: SQLiteDatabase) {
  await safeExecAsync(db, 'PRAGMA foreign_keys = ON');

  const currentVersion = await getCurrentSchemaVersion(db);

  if (currentVersion > DATABASE_SCHEMA_VERSION) {
    throw new Error(
      stepLabel('VERSION', `La base de datos está en versión ${currentVersion}, pero la app soporta hasta ${DATABASE_SCHEMA_VERSION}`),
    );
  }

  if (currentVersion >= DATABASE_SCHEMA_VERSION) return;

  if (currentVersion > 0) {
    await autoBackupBeforeMigration(db, currentVersion);
  }

  for (let version = currentVersion + 1; version <= DATABASE_SCHEMA_VERSION; version += 1) {
    await applyMigration(db, version);
  }
}

async function autoBackupBeforeMigration(db: SQLiteDatabase, currentVersion: number) {
  try {
    BACKUP_DIR.create({ idempotent: true, intermediates: true });

    const hasFamilies = await tableExists(db, 'families');
    const hasProducts = await tableExists(db, 'products');
    const hasCatalogs = await tableExists(db, 'catalogs');
    const hasProfile = await tableExists(db, 'profile');
    const hasOrders = await tableExists(db, 'orders');
    const hasSuppliers = await tableExists(db, 'suppliers');
    const hasQuotations = await tableExists(db, 'quotations');
    const hasClients = await tableExists(db, 'clients');
    const hasInvoices = await tableExists(db, 'invoices');

    const families = hasFamilies ? await db.getAllAsync('SELECT id, name, createdAt, updatedAt FROM families') : [];
    const products = hasProducts ? await db.getAllAsync('SELECT id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt FROM products') : [];
    const catalogs = hasCatalogs ? await db.getAllAsync('SELECT id, name, familyId, familyIds, format, productIds, pdfUri, purpose, createdAt FROM catalogs') : [];
    const profile = hasProfile ? await db.getAllAsync('SELECT id, businessName, ownerName, phone, email, address, website, logoUri, bankName, bankAccountType, bankAccountNumber, updatedAt FROM profile') : [];
    const orders = hasOrders ? await db.getAllAsync('SELECT id, orderNumber, clientName, clientId, items, subtotal, iva, total, status, paidAmount, notes, createdAt FROM orders') : [];
    const suppliers = hasSuppliers ? await db.getAllAsync('SELECT id, name, phone, email, contactName, notes, createdAt, updatedAt FROM suppliers') : [];
    const quotations = hasQuotations ? await db.getAllAsync('SELECT id, quotationNumber, clientName, clientRut, clientPhone, clientEmail, clientAddress, items, subtotal, ivaRate, ivaAmount, total, status, notes, validUntil, createdAt FROM quotations') : [];
    const clients = hasClients ? await db.getAllAsync('SELECT id, name, rut, phone, email, notes, createdAt, updatedAt FROM clients') : [];
    const invoices = hasInvoices ? await db.getAllAsync('SELECT id, invoiceNumber, invoiceDate, clientName, description, netAmount, taxAmount, totalAmount, paymentDate, status, createdAt, updatedAt FROM invoices') : [];
    const migrations = await db.getAllAsync('SELECT version, appliedAt FROM schema_migrations').catch(() => []);

    const backupData = {
      version: '3.2.2',
      createdAt: new Date().toISOString(),
      schemaVersion: currentVersion,
      families,
      products,
      catalogs,
      profile,
      orders,
      suppliers,
      quotations,
      clients,
      invoices,
      schemaMigrations: migrations,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `auto_backup_v${currentVersion}_to_v${DATABASE_SCHEMA_VERSION}_${timestamp}.json`;
    const file = new File(BACKUP_DIR, filename);

    file.create({ overwrite: true, intermediates: true });
    file.write(JSON.stringify(backupData, null, 2));
  } catch {
    // Backup failures should not block migration
  }
}

function isNativeNpe(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  return msg.includes('NullPointerException') || msg.includes('has been rejected');
}

function stepLabel(step: string, message: string): string {
  return `[${step}] ${message}`;
}

export async function dbStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const original = error instanceof Error ? error : new Error(String(error));
    const wrapped = new Error(stepLabel(label, original.message));
    wrapped.stack = original.stack;
    throw wrapped;
  }
}

let openAttempt = 0;

async function openAndMigrate(): Promise<SQLiteDatabase> {
  openAttempt += 1;
  const db = await openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
  try {
    await migrateDatabase(db);
    return db;
  } catch (error) {
    try {
      await db.closeAsync();
    } catch {
      // ignore
    }
    throw error;
  }
}

async function getDatabaseOnce(): Promise<SQLiteDatabase> {
  if (database) {
    return database;
  }

  if (!databasePromise) {
    databasePromise = openAndMigrate().then(async (db) => {
      database = db;
      const versionRow = await db
        .getFirstAsync<DatabaseVersionRow>('PRAGMA user_version')
        .catch(() => null);
      console.log(
        `[catalog-db] opened schema=${versionRow?.user_version ?? '?'} expected=${DATABASE_SCHEMA_VERSION} app=3.3.16 attempt=${openAttempt}`,
      );
      return db;
    });
  }

  try {
    database = await databasePromise;
    return database;
  } catch (error) {
    if (isNativeNpe(error) && openAttempt < 3) {
      database = null;
      databasePromise = null;
      console.warn('[getDatabase] NPE al abrir, reintentando con conexión fresca', error);
      return getDatabaseOnce();
    }
    database = null;
    databasePromise = null;
    throw error;
  }
}

export async function withRetryOnNpe<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isNativeNpe(error)) {
      throw error;
    }
    console.warn(`[sqlite] ${label}: NPE detectado. Reabriendo conexión y reintentando...`, error);
    database = null;
    databasePromise = null;
    return fn();
  }
}

export async function withDbTransaction<T>(
  task: (txn: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  return withRetryOnNpe('withDbTransaction', async () => {
    const db = await getDatabaseOnce();
    await dbStep('PRAGMA', () => db.execAsync('PRAGMA foreign_keys = ON'));
    await dbStep('BEGIN', () => db.execAsync('BEGIN IMMEDIATE'));
    try {
      const result = await task(db);
      await dbStep('COMMIT', () => db.execAsync('COMMIT'));
      return result;
    } catch (error) {
      try {
        await db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('[withDbTransaction] ROLLBACK failed', rollbackError);
      }
      throw error;
    }
  });
}

export function resetDatabase() {
  database = null;
  databasePromise = null;
}

export async function getDatabase() {
  return getDatabaseOnce();
}
