import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('catalog.db');
  }
  return dbInstance;
}

export function initializeSchema(): void {
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
}
