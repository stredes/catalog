import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';

let database: SQLiteDatabase | null = null;
let databasePromise: Promise<SQLiteDatabase> | null = null;

type DatabaseVersionRow = {
  user_version: number;
};

type ColumnInfo = {
  name: string;
};

const DATABASE_NAME = 'catalog.db';
export const DATABASE_SCHEMA_VERSION = 10;
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
};

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
    } catch {
      if (upperTrimmed.startsWith('ALTER TABLE') || upperTrimmed.startsWith('CREATE INDEX')) {
        continue;
      }
      throw new Error(`Migration v${version} failed: ${trimmed.slice(0, 80)}`);
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
      `La base de datos está en versión ${currentVersion}, pero la app soporta hasta ${DATABASE_SCHEMA_VERSION}`,
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

    const families = hasFamilies ? await db.getAllAsync('SELECT * FROM families') : [];
    const products = hasProducts ? await db.getAllAsync('SELECT * FROM products') : [];
    const catalogs = hasCatalogs ? await db.getAllAsync('SELECT * FROM catalogs') : [];
    const profile = hasProfile ? await db.getAllAsync('SELECT * FROM profile') : [];
    const orders = hasOrders ? await db.getAllAsync('SELECT * FROM orders') : [];
    const migrations = await db.getAllAsync('SELECT * FROM schema_migrations').catch(() => []);

    const backupData = {
      version: '3.1.7',
      createdAt: new Date().toISOString(),
      schemaVersion: currentVersion,
      families,
      products,
      catalogs,
      profile,
      orders,
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

export function resetDatabase() {
  database = null;
  databasePromise = null;
}

export async function getDatabase() {
  if (database) {
    return database;
  }

  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await migrateDatabase(db);
        database = db;
        return db;
      })
      .catch((error) => {
        database = null;
        databasePromise = null;
        throw error;
      });
  }

  database = await databasePromise;

  return database;
}
