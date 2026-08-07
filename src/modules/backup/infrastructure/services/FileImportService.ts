import { File } from 'expo-file-system';
import { getDatabase, withDbTransaction } from '../../../../shared/infrastructure/sqlite';
import { DATABASE_SCHEMA_VERSION } from '../../../../shared/infrastructure/schema-version';
import { restoreBackupImages } from './BackupImageCollector';
import { BackupImageMap } from '../../domain/entities/BackupSnapshot';
import { validateBackupPayload } from '../../../../shared/validation/schemas';
import type { ValidatedBackupPayload } from '../../../../shared/validation/schemas';
import { SQLiteBackupRepository } from '../repositories/SQLiteBackupRepository';
import { extractBackupArchive, isZipBackup } from './BackupArchiveService';

export type BackupPreview = {
  families: number;
  products: number;
  catalogs: number;
  orders: number;
  suppliers: number;
  quotations: number;
  clients: number;
  invoices: number;
  images: number;
};

type LegacyBackupData = {
  version?: string;
  createdAt?: string;
  schemaVersion?: number;
  families?: Array<{ id: string; name: string; createdAt: string; updatedAt: string }>;
  products?: Array<{ id: string; name: string; code: string | null; price: number; format: string; photoUri: string | null; familyId: string; stock: number; createdAt: string; updatedAt: string }>;
  catalogs?: Array<{ id: string; name: string; familyId: string; familyIds: string | null; format: string; productIds: string; pdfUri: string; purpose?: string | null; createdAt: string }>;
  profile?: Array<{ id: string; businessName: string; ownerName: string | null; phone: string | null; email: string | null; address: string | null; website: string | null; logoUri: string | null; bankName: string | null; bankAccountType: string | null; bankAccountNumber: string | null; updatedAt: string }>;
  orders?: Array<{ id: string; orderNumber: number; clientName: string; items: string; subtotal: number; iva: number; total: number; status?: string; paidAmount?: number; notes: string | null; createdAt: string }>;
  invoices?: Array<{ id: string; invoiceNumber: string; invoiceDate: string; clientName: string; description: string | null; netAmount: number; taxAmount: number; totalAmount: number; paymentDate: string | null; status?: string; createdAt: string; updatedAt: string }>;
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
  await db.execAsync(`CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY NOT NULL, invoice_number TEXT NOT NULL, invoice_date TEXT NOT NULL, client_name TEXT NOT NULL,
    description TEXT, net_amount REAL NOT NULL, tax_amount REAL NOT NULL, total_amount REAL NOT NULL,
    payment_date TEXT, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`);
}

async function clearAllTables(db: Awaited<ReturnType<typeof getDatabase>>) {
  await db.execAsync('PRAGMA foreign_keys = ON');
  const tables = ['invoices', 'orders', 'catalogs', 'products', 'families', 'profile', 'suppliers'];
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

export type ImportResult = {
  families: number;
  products: number;
  catalogs: number;
  orders: number;
  suppliers: number;
  quotations: number;
  clients: number;
  invoices: number;
  images: number;
};

async function restorePayload(
  payload: ValidatedBackupPayload,
  restoredImages: BackupImageMap,
): Promise<ImportResult> {
  const products = payload.products.map((product) => ({
    ...product,
    code: product.code ?? undefined,
    supplierId: product.supplierId ?? undefined,
    photoUri: product.photoUri
      ? (restoredImages[product.photoUri] ?? product.photoUri)
      : undefined,
  }));
  const profile = payload.profile
    ? {
        ...payload.profile,
        ownerName: payload.profile.ownerName ?? undefined,
        phone: payload.profile.phone ?? undefined,
        email: payload.profile.email ?? undefined,
        address: payload.profile.address ?? undefined,
        website: payload.profile.website ?? undefined,
        logoUri: payload.profile.logoUri
          ? (restoredImages[payload.profile.logoUri] ?? payload.profile.logoUri)
          : undefined,
        bankName: payload.profile.bankName ?? undefined,
        bankAccountType: payload.profile.bankAccountType ?? undefined,
        bankAccountNumber: payload.profile.bankAccountNumber ?? undefined,
      }
    : null;
  const catalogs = payload.catalogs.map((catalog) => ({
    ...catalog,
    familyIds: catalog.familyIds ?? undefined,
    purpose: catalog.purpose ?? undefined,
  }));
  const orders = payload.orders.map((order) => ({
    ...order,
    notes: order.notes ?? undefined,
    items: order.items.map((item) => ({
      ...item,
      productCode: item.productCode ?? undefined,
    })),
  }));
  const suppliers = payload.suppliers.map((supplier) => ({
    ...supplier,
    phone: supplier.phone ?? undefined,
    email: supplier.email ?? undefined,
    contactName: supplier.contactName ?? undefined,
    notes: supplier.notes ?? undefined,
  }));
  const clients = payload.clients.map((client) => ({
    ...client,
    rut: client.rut ?? undefined,
    phone: client.phone ?? undefined,
    email: client.email ?? undefined,
    notes: client.notes ?? undefined,
  }));
  const quotations = payload.quotations.map((quotation) => ({
    ...quotation,
    clientPhone: quotation.clientPhone ?? undefined,
    clientEmail: quotation.clientEmail ?? undefined,
    clientAddress: quotation.clientAddress ?? undefined,
    notes: quotation.notes ?? undefined,
    validUntil: quotation.validUntil ?? undefined,
  }));
  const invoices = payload.invoices.map((invoice) => ({
    ...invoice,
    description: invoice.description ?? undefined,
    paymentDate: invoice.paymentDate ?? undefined,
  }));

  await new SQLiteBackupRepository().transactionalRestore({
    families: payload.families,
    products,
    catalogs,
    profile,
    orders,
    suppliers,
    quotations,
    clients,
    invoices,
  });

  return {
    families: payload.families.length,
    products: payload.products.length,
    catalogs: payload.catalogs.length,
    orders: payload.orders.length,
    suppliers: payload.suppliers.length,
    quotations: payload.quotations?.length ?? 0,
    clients: payload.clients?.length ?? 0,
    invoices: payload.invoices?.length ?? 0,
    images: Object.keys(restoredImages).length,
  };
}

export async function importBackupFromFile(filepath: string): Promise<ImportResult> {
  if (await isZipBackup(filepath)) {
    const { payload: rawPayload, restoredImages } = await extractBackupArchive(filepath);
    const validated = validateBackupPayload(rawPayload);
    if (!validated.success) {
      throw new Error('El archivo ZIP contiene un backup inválido.');
    }
    return restorePayload(validated.data, restoredImages);
  }

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
    return restorePayload(payload, restoredImages);
  }

  const data = raw as LegacyBackupData;
  if (!data.families && !data.products && !data.catalogs && !data.orders && !data.invoices) {
    throw new Error('El archivo no contiene datos de backup reconocidos.');
  }

  const db = await getDatabase();

  const currentVersion = await checkSchemaVersion(db);
  if (currentVersion > DATABASE_SCHEMA_VERSION) {
    throw new Error(
      `La base de datos está en versión ${currentVersion}, pero la app soporta hasta ${DATABASE_SCHEMA_VERSION}. Actualiza la app.`
    );
  }

  let counts: ImportResult = { families: 0, products: 0, catalogs: 0, orders: 0, suppliers: 0, quotations: 0, clients: 0, invoices: 0, images: 0 };

  await ensureAllTablesExist(db);
  await clearAllTables(db);

  await db.execAsync('PRAGMA foreign_keys = ON');

  if (data.families?.length) {
    await withDbTransaction(async (txn) => {
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
      await withDbTransaction(async (txn) => {
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
    await withDbTransaction(async (txn) => {
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
    await withDbTransaction(async (txn) => {
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
    await withDbTransaction(async (txn) => {
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

  if (data.invoices?.length) {
    await withDbTransaction(async (txn) => {
      for (const inv of data.invoices!) {
        await txn.runAsync(
          'INSERT OR REPLACE INTO invoices (id, invoice_number, invoice_date, client_name, description, net_amount, tax_amount, total_amount, payment_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          inv.id, inv.invoiceNumber, inv.invoiceDate, inv.clientName,
          inv.description ?? null, inv.netAmount, inv.taxAmount, inv.totalAmount,
          inv.paymentDate ?? null, inv.status ?? 'pending', inv.createdAt, inv.updatedAt,
        );
      }
    });
    counts.invoices = data.invoices.length;
  }

  counts.images = Object.keys(restoredImages).length;

  return counts;
}

export async function previewBackupFromFile(filepath: string): Promise<BackupPreview> {
  const file = new File(filepath);
  if (!file.exists) {
    throw new Error('El archivo de backup no existe.');
  }

  if (await isZipBackup(filepath)) {
    const { payload: rawPayload } = await extractBackupArchive(filepath, { writeImages: false });
    const validated = validateBackupPayload(rawPayload);
    if (!validated.success) {
      throw new Error('El archivo ZIP contiene un backup inválido.');
    }
    const payload = validated.data;
    return {
      families: payload.families.length,
      products: payload.products.length,
      catalogs: payload.catalogs.length,
      orders: payload.orders.length,
      suppliers: payload.suppliers.length,
      quotations: payload.quotations?.length ?? 0,
      clients: payload.clients?.length ?? 0,
      invoices: payload.invoices?.length ?? 0,
      images: Object.keys(payload.imageFiles ?? {}).length,
    };
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
    return {
      families: payload.families.length,
      products: payload.products.length,
      catalogs: payload.catalogs.length,
      orders: payload.orders.length,
      suppliers: payload.suppliers.length,
      quotations: payload.quotations?.length ?? 0,
      clients: payload.clients?.length ?? 0,
      invoices: payload.invoices?.length ?? 0,
      images: Object.keys(payload.images).length,
    };
  }

  const data = raw as Record<string, unknown>;
  if (!data.families && !data.products && !data.catalogs && !data.orders && !data.invoices) {
    throw new Error('El archivo no contiene datos de backup reconocidos.');
  }

  return {
    families: (data.families as unknown[] | undefined)?.length ?? 0,
    products: (data.products as unknown[] | undefined)?.length ?? 0,
    catalogs: (data.catalogs as unknown[] | undefined)?.length ?? 0,
    orders: (data.orders as unknown[] | undefined)?.length ?? 0,
    suppliers: (data.suppliers as unknown[] | undefined)?.length ?? 0,
    quotations: (data.quotations as unknown[] | undefined)?.length ?? 0,
    clients: (data.clients as unknown[] | undefined)?.length ?? 0,
    invoices: (data.invoices as unknown[] | undefined)?.length ?? 0,
    images: data.images && typeof data.images === 'object'
      ? Object.keys(data.images as Record<string, string>).length
      : 0,
  };
}