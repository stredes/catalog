import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Quotation, QuotationStatus } from '../../domain/entities/Quotation';
import { ServiceItem } from '../../domain/entities/ServiceItem';
import { QuotationRepository } from '../../domain/repositories/QuotationRepository';

type QuotationRow = {
  id: string;
  quotationNumber: number;
  clientName: string;
  clientRut: string | null;
  clientPhone: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  items: string;
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  total: number;
  status: string;
  notes: string | null;
  validUntil: string | null;
  createdAt: string;
};

function rowToQuotation(row: QuotationRow): Quotation {
  let items: ServiceItem[];
  try {
    const parsed: unknown = JSON.parse(row.items);
    items = Array.isArray(parsed) ? (parsed as ServiceItem[]) : [];
  } catch {
    items = [];
  }

  const validStatus: QuotationStatus = (['pending', 'accepted', 'paid', 'rejected', 'deleted'].includes(row.status)
    ? row.status
    : 'pending') as QuotationStatus;

  return {
    id: row.id,
    quotationNumber: row.quotationNumber,
    clientName: row.clientName,
    clientRut: row.clientRut ?? undefined,
    clientPhone: row.clientPhone ?? undefined,
    clientEmail: row.clientEmail ?? undefined,
    clientAddress: row.clientAddress ?? undefined,
    items,
    subtotal: row.subtotal,
    ivaRate: row.ivaRate,
    ivaAmount: row.ivaAmount,
    total: row.total,
    status: validStatus,
    notes: row.notes ?? undefined,
    validUntil: row.validUntil ?? undefined,
    createdAt: row.createdAt,
  };
}

export class SQLiteQuotationRepository implements QuotationRepository {
  async save(quotation: Quotation): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO quotations (id, quotationNumber, clientName, clientRut, clientPhone, clientEmail, clientAddress, items, subtotal, ivaRate, ivaAmount, total, status, notes, validUntil, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      quotation.id,
      quotation.quotationNumber,
      quotation.clientName,
      quotation.clientRut ?? null,
      quotation.clientPhone ?? null,
      quotation.clientEmail ?? null,
      quotation.clientAddress ?? null,
      JSON.stringify(quotation.items),
      quotation.subtotal,
      quotation.ivaRate,
      quotation.ivaAmount,
      quotation.total,
      quotation.status ?? 'pending',
      quotation.notes ?? null,
      quotation.validUntil ?? null,
      quotation.createdAt,
    );
  }

  async update(quotation: Quotation): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE quotations SET clientName = ?, clientRut = ?, clientPhone = ?, clientEmail = ?, clientAddress = ?, items = ?, subtotal = ?, ivaRate = ?, ivaAmount = ?, total = ?, status = ?, notes = ?, validUntil = ? WHERE id = ?`,
      quotation.clientName,
      quotation.clientRut ?? null,
      quotation.clientPhone ?? null,
      quotation.clientEmail ?? null,
      quotation.clientAddress ?? null,
      JSON.stringify(quotation.items),
      quotation.subtotal,
      quotation.ivaRate,
      quotation.ivaAmount,
      quotation.total,
      quotation.status ?? 'pending',
      quotation.notes ?? null,
      quotation.validUntil ?? null,
      quotation.id,
    );
  }

  async findAll(): Promise<Quotation[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<QuotationRow>(
      'SELECT id, quotationNumber, clientName, clientRut, clientPhone, clientEmail, clientAddress, items, subtotal, ivaRate, ivaAmount, total, status, notes, validUntil, createdAt FROM quotations ORDER BY createdAt DESC',
    );
    return rows.map(rowToQuotation);
  }

  async findById(id: string): Promise<Quotation | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<QuotationRow>(
      'SELECT id, quotationNumber, clientName, clientRut, clientPhone, clientEmail, clientAddress, items, subtotal, ivaRate, ivaAmount, total, status, notes, validUntil, createdAt FROM quotations WHERE id = ?',
      id,
    );
    return row ? rowToQuotation(row) : null;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM quotations WHERE id = ?', id);
  }

  async getMaxQuotationNumber(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ maxNum: number }>(
      'SELECT COALESCE(MAX(quotationNumber), 0) as maxNum FROM quotations',
    );
    return row?.maxNum ?? 0;
  }
}
