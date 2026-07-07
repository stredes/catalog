import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('catalog.db');
  }
  return dbInstance;
}

function getCurrentVersion(): number {
  const db = getDatabase();
  const result = db.getFirstSync('PRAGMA user_version') as any;
  return result?.user_version ?? 0;
}

function setVersion(version: number): void {
  getDatabase().execSync(`PRAGMA user_version = ${version}`);
}

function columnExists(table: string, column: string): boolean {
  const rows = getDatabase().getAllSync(`PRAGMA table_info(${table})`) as any[];
  return rows.some((r: any) => r.name === column);
}

interface Migration {
  version: number;
  name: string;
  up: () => void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    up: () => {
      const db = getDatabase();
      db.execSync(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          format TEXT NOT NULL,
          photoUri TEXT,
          familyId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      db.execSync(`
        CREATE TABLE IF NOT EXISTS families (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    name: 'add_family_timestamps',
    up: () => {
      const db = getDatabase();
      if (!columnExists('families', 'createdAt')) {
        db.execSync("ALTER TABLE families ADD COLUMN createdAt TEXT NOT NULL DEFAULT ''");
      }
      if (!columnExists('families', 'updatedAt')) {
        db.execSync("ALTER TABLE families ADD COLUMN updatedAt TEXT NOT NULL DEFAULT ''");
      }
    },
  },
  {
    version: 3,
    name: 'seed_default_families',
    up: () => {
      const db = getDatabase();
      const count = (db.getFirstSync('SELECT COUNT(*) as count FROM families') as any).count;
      if (count > 0) return;

      const now = new Date().toISOString();
      const families = [
        { id: 'family-1', name: 'General' },
        { id: 'family-2', name: 'Ofertas' },
        { id: 'family-3', name: 'Nuevos' },
      ];
      for (const f of families) {
        db.runSync(
          'INSERT INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
          [f.id, f.name, now, now],
        );
      }
    },
  },
  {
    version: 4,
    name: 'create_profiles_table',
    up: () => {
      const db = getDatabase();
      db.execSync(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          company TEXT NOT NULL,
          address TEXT NOT NULL,
          photoUri TEXT,
          rut TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
    },
  },
];

export function runMigrations(): void {
  let currentVersion = getCurrentVersion();

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      migration.up();
      setVersion(migration.version);
      currentVersion = migration.version;
    }
  }
}
