import { getDatabase, withDbTransaction, dbStep } from '../../../../shared/infrastructure/sqlite';
import { BackupSnapshot, BackupPayload } from '../../domain/entities/BackupSnapshot';
import { BackupRepository, TransactionalRestoreData } from '../../domain/repositories/BackupRepository';
import { validateBackupPayload } from '../../../../shared/validation/schemas';
import { recordImportedOnce } from '../../../invoices/infrastructure/services/RecordHistorySql';

type SnapshotRow = {
  id: string;
  label: string;
  trigger: string;
  familiesCount: number;
  productsCount: number;
  catalogsCount: number;
  ordersCount: number;
  suppliersCount: number;
  invoicesCount: number;
  hasProfile: number;
  checksum: string;
  createdAt: string;
};

type PayloadRow = {
  snapshotId: string;
  payload: string;
};

const MAX_SNAPSHOTS = 10;

export class SQLiteBackupRepository implements BackupRepository {
  async saveSnapshot(snapshot: BackupSnapshot, payload: BackupPayload): Promise<void> {
    await withDbTransaction(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO backup_snapshots (id, label, trigger, familiesCount, productsCount, catalogsCount, ordersCount, suppliersCount, invoicesCount, hasProfile, checksum, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        snapshot.id,
        snapshot.label,
        snapshot.trigger,
        snapshot.familiesCount,
        snapshot.productsCount,
        snapshot.catalogsCount,
        snapshot.ordersCount ?? 0,
        snapshot.suppliersCount ?? 0,
        snapshot.invoicesCount ?? 0,
        snapshot.hasProfile ? 1 : 0,
        snapshot.checksum,
        snapshot.createdAt,
      );

      await transaction.runAsync(
        'INSERT INTO backup_payloads (snapshotId, payload) VALUES (?, ?)',
        snapshot.id,
        JSON.stringify(payload),
      );
    });

    await this.enforceMaxSnapshots();
  }

  async findAll(): Promise<BackupSnapshot[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SnapshotRow>(
      'SELECT id, label, trigger, familiesCount, productsCount, catalogsCount, ordersCount, suppliersCount, invoicesCount, hasProfile, checksum, createdAt FROM backup_snapshots ORDER BY createdAt DESC'
    );
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<BackupSnapshot | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SnapshotRow>(
      'SELECT id, label, trigger, familiesCount, productsCount, catalogsCount, ordersCount, suppliersCount, invoicesCount, hasProfile, checksum, createdAt FROM backup_snapshots WHERE id = ?',
      id
    );
    return row ? this.toDomain(row) : null;
  }

  async loadPayload(id: string): Promise<BackupPayload | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PayloadRow>(
      'SELECT payload FROM backup_payloads WHERE snapshotId = ?',
      id
    );
    if (!row) return null;

    let raw: unknown;
    try {
      raw = JSON.parse(row.payload);
    } catch {
      throw new Error('Payload del backup corrupto: JSON inválido');
    }

    const result = validateBackupPayload(raw);
    if (!result.success) {
      throw new Error(
        `Payload del backup inválido: ${result.errors.slice(0, 3).map((e) => `${e.path} ${e.message}`).join('; ')}`,
      );
    }

    // El schema tolera null en campos opcionales (payloads legacy); los
    // consumidores usan `?? undefined`/`?? null` al persistir, así que los
    // nulls restantes son inofensivos.
    return result.data as unknown as BackupPayload;
  }

  async delete(id: string): Promise<void> {
    await withDbTransaction(async (transaction) => {
      await transaction.runAsync('DELETE FROM backup_payloads WHERE snapshotId = ?', id);
      await transaction.runAsync('DELETE FROM backup_snapshots WHERE id = ?', id);
    });
  }

  async deleteAll(): Promise<void> {
    await withDbTransaction(async (transaction) => {
      await transaction.runAsync('DELETE FROM backup_payloads');
      await transaction.runAsync('DELETE FROM backup_snapshots');
    });
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM backup_snapshots'
    );
    return row?.total ?? 0;
  }

  async transactionalRestore(data: TransactionalRestoreData): Promise<void> {
    await withDbTransaction(async (txn) => {
      await dbStep('DELETE', async () => {
        await txn.runAsync('DELETE FROM orders');
        await txn.runAsync('DELETE FROM catalogs');
        await txn.runAsync('DELETE FROM products');
        await txn.runAsync('DELETE FROM suppliers');
        await txn.runAsync('DELETE FROM families');
        await txn.runAsync('DELETE FROM profile');
        await txn.runAsync('DELETE FROM quotations');
        await txn.runAsync('DELETE FROM clients');
        await txn.runAsync('DELETE FROM invoices');
      });

      await dbStep('FAMILIES', async () => {
        for (const family of data.families) {
          await txn.runAsync(
            'INSERT INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
            family.id, family.name, family.createdAt, family.updatedAt,
          );
        }
      });

      await dbStep('SUPPLIERS', async () => {
        for (const supplier of data.suppliers) {
          await txn.runAsync(
            `INSERT INTO suppliers (id, name, phone, email, contactName, notes, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            supplier.id, supplier.name, supplier.phone ?? null, supplier.email ?? null,
            supplier.contactName ?? null, supplier.notes ?? null,
            supplier.createdAt, supplier.updatedAt,
          );
        }
      });

      await dbStep('PRODUCTS', async () => {
        for (const product of data.products) {
          await txn.runAsync(
            `INSERT INTO products (id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            product.id, product.name, product.code ?? null, product.price, product.stock,
            product.format, product.photoUri ?? null, product.familyId, product.supplierId ?? null,
            product.createdAt, product.updatedAt,
          );
        }
      });

      await dbStep('CATALOGS', async () => {
        for (const catalog of data.catalogs) {
          await txn.runAsync(
            `INSERT INTO catalogs (id, name, familyId, familyIds, format, productIds, pdfUri, purpose, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            catalog.id, catalog.name, catalog.familyId,
            catalog.familyIds ? JSON.stringify(catalog.familyIds) : null,
            catalog.format, JSON.stringify(catalog.productIds), catalog.pdfUri,
            catalog.purpose ?? null, catalog.createdAt,
          );
        }
      });

      await dbStep('PROFILE', async () => {
        if (data.profile) {
          await txn.runAsync(
            `INSERT INTO profile (id, businessName, ownerName, phone, email, address, website, logoUri, bankName, bankAccountType, bankAccountNumber, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            data.profile.id, data.profile.businessName, data.profile.ownerName ?? null,
            data.profile.phone ?? null, data.profile.email ?? null, data.profile.address ?? null,
            data.profile.website ?? null, data.profile.logoUri ?? null, data.profile.bankName ?? null,
            data.profile.bankAccountType ?? null, data.profile.bankAccountNumber ?? null,
            data.profile.updatedAt,
          );
        }
      });

      await dbStep('ORDERS', async () => {
        for (const order of data.orders) {
          await txn.runAsync(
            `INSERT INTO orders (id, orderNumber, clientName, items, subtotal, iva, total, status, paidAmount, notes, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            order.id, order.orderNumber, order.clientName,
            JSON.stringify(order.items), order.subtotal, order.iva, order.total,
            order.status, order.paidAmount, order.notes ?? null, order.createdAt,
          );
        }
      });

      await dbStep('QUOTATIONS', async () => {
        for (const quotation of data.quotations) {
          await txn.runAsync(
            `INSERT INTO quotations (id, quotationNumber, clientName, clientPhone, clientEmail, clientAddress, items, subtotal, ivaRate, ivaAmount, total, status, notes, validUntil, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            quotation.id, quotation.quotationNumber, quotation.clientName,
            quotation.clientPhone ?? null, quotation.clientEmail ?? null,
            quotation.clientAddress ?? null, JSON.stringify(quotation.items),
            quotation.subtotal, quotation.ivaRate, quotation.ivaAmount, quotation.total,
            quotation.status, quotation.notes ?? null, quotation.validUntil ?? null,
            quotation.createdAt,
          );
        }
      });

      await dbStep('CLIENTS', async () => {
        for (const client of data.clients ?? []) {
          await txn.runAsync(
            `INSERT INTO clients (id, name, rut, phone, email, notes, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            client.id, client.name, client.rut ?? null, client.phone ?? null,
            client.email ?? null, client.notes ?? null,
            client.createdAt, client.updatedAt,
          );
        }
      });

      await dbStep('INVOICES', async () => {
        for (let index = 0; index < (data.invoices ?? []).length; index += 1) {
          const invoice = (data.invoices ?? [])[index];
          try {
            await txn.runAsync(
              `INSERT INTO invoices (id, invoice_number, invoice_date, client_name, description, net_amount, tax_amount, total_amount, payment_date, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              invoice.id, invoice.invoiceNumber, invoice.invoiceDate, invoice.clientName,
              invoice.description ?? null, invoice.netAmount, invoice.taxAmount, invoice.totalAmount,
              invoice.paymentDate ?? null, invoice.status, invoice.createdAt, invoice.updatedAt,
            );
            await recordImportedOnce(txn, invoice.id, invoice, invoice.createdAt);
          } catch (error) {
            console.error(`[restore] invoice #${index} failed`, invoice?.invoiceNumber, error);
            throw error;
          }
        }
      });
    });
  }

  private async enforceMaxSnapshots(): Promise<void> {
    const count = await this.count();

    if (count > MAX_SNAPSHOTS) {
      const excess = count - MAX_SNAPSHOTS;
      await withDbTransaction(async (transaction) => {
        await transaction.runAsync(
          `DELETE FROM backup_payloads WHERE snapshotId IN (
            SELECT id FROM backup_snapshots ORDER BY createdAt ASC LIMIT ?
          )`,
          excess
        );
        await transaction.runAsync(
          `DELETE FROM backup_snapshots WHERE id IN (
            SELECT id FROM backup_snapshots ORDER BY createdAt ASC LIMIT ?
          )`,
          excess
        );
      });
    }
  }

  private toDomain(row: SnapshotRow): BackupSnapshot {
    return {
      id: row.id,
      label: row.label,
      trigger: row.trigger as BackupSnapshot['trigger'],
      familiesCount: row.familiesCount,
      productsCount: row.productsCount,
      catalogsCount: row.catalogsCount,
      ordersCount: row.ordersCount,
      suppliersCount: row.suppliersCount ?? 0,
      invoicesCount: row.invoicesCount ?? 0,
      hasProfile: row.hasProfile === 1,
      checksum: row.checksum,
      filePath: '',
      createdAt: row.createdAt,
    };
  }
}
