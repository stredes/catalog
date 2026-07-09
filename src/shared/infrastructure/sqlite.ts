import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';

let database: SQLiteDatabase | null = null;
let databasePromise: Promise<SQLiteDatabase> | null = null;

type DatabaseVersionRow = {
  user_version: number;
};

const DATABASE_NAME = 'catalog.db';
const DATABASE_SCHEMA_VERSION = 4;

const migrations: Record<number, string> = {
  1: `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      appliedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      format TEXT NOT NULL,
      photoUri TEXT,
      familyId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (familyId) REFERENCES families(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS catalogs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      familyId TEXT NOT NULL,
      format TEXT NOT NULL,
      productIds TEXT NOT NULL,
      pdfUri TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `,
  2: `
    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY NOT NULL,
      businessName TEXT NOT NULL,
      ownerName TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      website TEXT,
      logoUri TEXT,
      updatedAt TEXT NOT NULL
    );
  `,
  3: `
    ALTER TABLE catalogs ADD COLUMN familyIds TEXT;
  `,
  4: `
    ALTER TABLE products ADD COLUMN code TEXT;
  `,
};

async function getCurrentSchemaVersion(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<DatabaseVersionRow>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

async function applyMigration(db: SQLiteDatabase, version: number) {
  const sql = migrations[version];

  if (!sql) {
    throw new Error(`No existe migracion para la version ${version}`);
  }

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(sql);
    await transaction.runAsync(
      'INSERT OR IGNORE INTO schema_migrations (version, appliedAt) VALUES (?, ?)',
      version,
      new Date().toISOString(),
    );
    await transaction.execAsync(`PRAGMA user_version = ${version}`);
  });
}

async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const currentVersion = await getCurrentSchemaVersion(db);

  if (currentVersion > DATABASE_SCHEMA_VERSION) {
    throw new Error(
      `La base de datos esta en version ${currentVersion}, pero la app soporta hasta ${DATABASE_SCHEMA_VERSION}`,
    );
  }

  for (let version = currentVersion + 1; version <= DATABASE_SCHEMA_VERSION; version += 1) {
    await applyMigration(db, version);
  }
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
