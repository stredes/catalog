import { getDatabase, withDbTransaction } from '../../../../shared/infrastructure/sqlite';
import { createId } from '../../../../shared/utils/ids';
import { Invoice, InvoiceStatus } from '../../domain/entities/Invoice';
import { InvoiceRepository } from '../../domain/repositories/InvoiceRepository';
import { insertRecordHistory, serializeSnapshot } from '../services/RecordHistorySql';

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  client_name: string;
  description: string | null;
  net_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    clientName: row.client_name,
    description: row.description ?? undefined,
    netAmount: row.net_amount,
    taxAmount: row.tax_amount,
    totalAmount: row.total_amount,
    paymentDate: row.payment_date ?? undefined,
    status: row.status === 'paid' ? 'paid' : 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes('unique')
  );
}

export class SQLiteInvoiceRepository implements InvoiceRepository {
  async create(invoice: Invoice): Promise<Invoice> {
    const db = await getDatabase();
    const exists = await this.existsByInvoiceNumber(invoice.invoiceNumber);
    if (exists) {
      throw new Error('Ya existe una factura con ese numero');
    }

    try {
      await withDbTransaction(async (txn) => {
        await txn.runAsync(
          `INSERT INTO invoices (
            id, invoice_number, invoice_date, client_name, description,
            net_amount, tax_amount, total_amount, payment_date, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          invoice.id,
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.clientName,
          invoice.description ?? null,
          invoice.netAmount,
          invoice.taxAmount,
          invoice.totalAmount,
          invoice.paymentDate ?? null,
          invoice.status,
          invoice.createdAt,
          invoice.updatedAt,
        );

        await insertRecordHistory(txn, {
          entityType: 'invoice',
          entityId: invoice.id,
          action: 'created',
          snapshot: invoice,
          occurredAt: invoice.createdAt,
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error('Ya existe una factura con ese numero');
      }
      throw error;
    }

    return invoice;
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const db = await getDatabase();
    const exists = await this.existsByInvoiceNumber(invoice.invoiceNumber, invoice.id);
    if (exists) {
      throw new Error('Ya existe una factura con ese numero');
    }

    try {
      await withDbTransaction(async (txn) => {
        const previousRow = await this.findRowById(invoice.id);
        if (!previousRow) throw new Error('La factura no existe');

        const result = await txn.runAsync(
          `UPDATE invoices SET
            invoice_number = ?, invoice_date = ?, client_name = ?,
            description = ?, net_amount = ?, tax_amount = ?,
            total_amount = ?, payment_date = ?, status = ?, updated_at = ?
           WHERE id = ?`,
          invoice.invoiceNumber,
          invoice.invoiceDate,
          invoice.clientName,
          invoice.description ?? null,
          invoice.netAmount,
          invoice.taxAmount,
          invoice.totalAmount,
          invoice.paymentDate ?? null,
          invoice.status,
          invoice.updatedAt,
          invoice.id,
        );

        if (result.changes === 0) throw new Error('La factura no existe');

        await insertRecordHistory(txn, {
          entityType: 'invoice',
          entityId: invoice.id,
          action: 'updated',
          snapshot: invoice,
          previousSnapshot: previousRow ? rowToInvoice(previousRow) : undefined,
          occurredAt: invoice.updatedAt,
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error('Ya existe una factura con ese numero');
      }
      throw error;
    }

    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus, paymentDate?: string): Promise<Invoice> {
    const db = await getDatabase();
    const updatedAt = new Date().toISOString();
    let updated: Invoice | null = null;

    await withDbTransaction(async (txn) => {
      const previousRow = await this.findRowById(id);
      if (!previousRow) throw new Error('La factura no existe');

      const nextPaymentDate = status === 'paid' ? (paymentDate ?? new Date().toISOString().slice(0, 10)) : null;

      const result = await txn.runAsync(
        'UPDATE invoices SET status = ?, payment_date = ?, updated_at = ? WHERE id = ?',
        status,
        nextPaymentDate,
        updatedAt,
        id,
      );
      if (result.changes === 0) throw new Error('La factura no existe');

      const nextRow = await this.findRowById(id);
      if (!nextRow) throw new Error('No se pudo actualizar la factura');

      updated = rowToInvoice(nextRow);

      await insertRecordHistory(txn, {
        entityType: 'invoice',
        entityId: id,
        action: 'updated',
        snapshot: updated,
        previousSnapshot: previousRow ? rowToInvoice(previousRow) : undefined,
        occurredAt: updatedAt,
      });
    });

    if (!updated) throw new Error('No se pudo actualizar la factura');
    return updated;
  }

  async findById(id: string): Promise<Invoice | null> {
    const row = await this.findRowById(id);
    return row ? rowToInvoice(row) : null;
  }

  async findAll(): Promise<Invoice[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<InvoiceRow>(
      `SELECT * FROM invoices ORDER BY invoice_date DESC, CAST(invoice_number AS INTEGER) DESC`,
    );
    return rows.map(rowToInvoice);
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await withDbTransaction(async (txn) => {
      const previousRow = await this.findRowById(id);
      if (!previousRow) throw new Error('La factura no existe');

      const result = await txn.runAsync('DELETE FROM invoices WHERE id = ?', id);
      if (result.changes === 0) throw new Error('La factura no existe');

      await insertRecordHistory(txn, {
        entityType: 'invoice',
        entityId: id,
        action: 'deleted',
        snapshot: previousRow ? rowToInvoice(previousRow) : {},
      });
    });
  }

  async existsByInvoiceNumber(invoiceNumber: string, excludedId?: string): Promise<boolean> {
    const db = await getDatabase();
    const normalized = invoiceNumber.trim();
    const row = excludedId
      ? await db.getFirstAsync<{ invoice_count: number }>(
          'SELECT COUNT(*) AS invoice_count FROM invoices WHERE invoice_number = ? AND id <> ?',
          normalized,
          excludedId,
        )
      : await db.getFirstAsync<{ invoice_count: number }>(
          'SELECT COUNT(*) AS invoice_count FROM invoices WHERE invoice_number = ?',
          normalized,
        );
    return (row?.invoice_count ?? 0) > 0;
  }

  private async findRowById(id: string): Promise<InvoiceRow | null> {
    const db = await getDatabase();
    return db.getFirstAsync<InvoiceRow>('SELECT * FROM invoices WHERE id = ? LIMIT 1', id);
  }
}
