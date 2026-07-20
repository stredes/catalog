import { Directory, File, Paths } from 'expo-file-system';
import { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './sqlite';

const BACKUP_DIR = new Directory(Paths.document, 'backups');

type BackupData = {
  version: string;
  createdAt: string;
  schemaVersion: number;
  families: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>;
  products: Array<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>;
  catalogs: Array<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; createdAt: string }>;
  profile: Array<{ id: string; businessName: string; ownerName: string | null; phone: string | null; email: string | null; address: string | null; website: string | null; logoUri: string | null; bankName: string | null; bankAccountType: string | null; bankAccountNumber: string | null; updatedAt: string }>;
  orders: Array<{ id: string; clientName: string; items: string; subtotal: number; iva: number; total: number; notes: string | null; createdAt: string }>;
  schemaMigrations: Array<{ version: number; appliedAt: string }>;
};

function ensureBackupDir() {
  BACKUP_DIR.create({ idempotent: true, intermediates: true });
}

async function exportData(db: SQLiteDatabase): Promise<BackupData> {
  const [families, products, catalogs, profile, orders, schemaMigrations, versionRow] = await Promise.all([
    db.getAllAsync<{ id: string; name: string; createdAt: string; updatedAt: string }>('SELECT * FROM families'),
    db.getAllAsync<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>('SELECT * FROM products'),
    db.getAllAsync<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; createdAt: string }>('SELECT * FROM catalogs'),
    db.getAllAsync<{ id: string; businessName: string; ownerName: string | null; phone: string | null; email: string | null; address: string | null; website: string | null; logoUri: string | null; bankName: string | null; bankAccountType: string | null; bankAccountNumber: string | null; updatedAt: string }>('SELECT * FROM profile'),
    db.getAllAsync<{ id: string; clientName: string; items: string; subtotal: number; iva: number; total: number; notes: string | null; createdAt: string }>('SELECT * FROM orders'),
    db.getAllAsync<{ version: number; appliedAt: string }>('SELECT * FROM schema_migrations ORDER BY version'),
    db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
  ]);

  return {
    version: '3.0.0',
    createdAt: new Date().toISOString(),
    schemaVersion: versionRow?.user_version ?? 0,
    families,
    products,
    catalogs,
    profile,
    orders,
    schemaMigrations,
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

export async function restoreBackup(filepath: string): Promise<{ families: number; products: number; catalogs: number; orders: number }> {
  const file = new File(filepath);
  const content = await file.text();

  const data: BackupData = JSON.parse(content);
  const db = await getDatabase();

  let counts = { families: 0, products: 0, catalogs: 0, orders: 0 };

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM orders');
    await txn.execAsync('DELETE FROM catalogs');
    await txn.execAsync('DELETE FROM products');
    await txn.execAsync('DELETE FROM families');
    await txn.execAsync('DELETE FROM profile');
    await txn.execAsync('DELETE FROM schema_migrations');

    for (const f of data.families) {
      await txn.runAsync(
        'INSERT INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        f.id, f.name, f.createdAt, f.updatedAt,
      );
      counts.families++;
    }

    for (const p of data.products) {
      await txn.runAsync(
        'INSERT INTO products (id, name, code, price, format, photoUri, familyId, stock, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p.id, p.name, p.code, p.price, p.format, p.photoUri, p.familyId, p.stock, p.createdAt, p.updatedAt,
      );
      counts.products++;
    }

    for (const c of data.catalogs) {
      await txn.runAsync(
        'INSERT INTO catalogs (id, name, familyId, familyIds, format, productIds, pdfUri, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        c.id, c.name, c.familyId, c.familyIds, c.format, c.productIds, c.pdfUri, c.createdAt,
      );
      counts.catalogs++;
    }

    for (const o of data.orders) {
      await txn.runAsync(
        'INSERT INTO orders (id, clientName, items, subtotal, iva, total, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        o.id, o.clientName, o.items, o.subtotal, o.iva, o.total, o.notes, o.createdAt,
      );
      counts.orders++;
    }

    for (const p of data.profile) {
      await txn.runAsync(
        'INSERT INTO profile (id, businessName, ownerName, phone, email, address, website, logoUri, bankName, bankAccountType, bankAccountNumber, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        p.id, p.businessName, p.ownerName, p.phone, p.email, p.address, p.website, p.logoUri, p.bankName, p.bankAccountType, p.bankAccountNumber, p.updatedAt,
      );
    }

    for (const m of data.schemaMigrations) {
      await txn.runAsync(
        'INSERT INTO schema_migrations (version, appliedAt) VALUES (?, ?)',
        m.version, m.appliedAt,
      );
    }

    await txn.execAsync(`PRAGMA user_version = ${data.schemaVersion}`);
  });

  return counts;
}

export async function deleteBackup(filepath: string): Promise<void> {
  const file = new File(filepath);
  if (file.info().exists) {
    file.delete();
  }
}
