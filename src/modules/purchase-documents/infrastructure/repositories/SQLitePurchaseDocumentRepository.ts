import { File } from 'expo-file-system';
import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { NewPurchaseDocument, PurchaseDocument, PurchaseDocumentStatus, PurchaseDocumentType } from '../../domain/entities/PurchaseDocument';
import { PurchaseDocumentRepository } from '../../domain/repositories/PurchaseDocumentRepository';

type PurchaseDocumentRow = {
  id: string;
  documentNumber: number;
  type: string;
  supplierId: string;
  supplierName: string;
  items: string;
  netAmount: number;
  ivaAmount: number;
  total: number;
  notes: string | null;
  pdfUri: string | null;
  status: string;
  createdAt: string;
};

function toEntity(row: PurchaseDocumentRow): PurchaseDocument {
  let items: PurchaseDocument['items'] = [];
  try {
    const parsed: unknown = JSON.parse(row.items);
    if (Array.isArray(parsed)) items = parsed as PurchaseDocument['items'];
  } catch {
    items = [];
  }
  return {
    ...row,
    type: row.type as PurchaseDocumentType,
    items,
    notes: row.notes ?? undefined,
    pdfUri: row.pdfUri ?? undefined,
    status: row.status as PurchaseDocumentStatus,
  };
}

export class SQLitePurchaseDocumentRepository implements PurchaseDocumentRepository {
  async createDraft(document: NewPurchaseDocument, minimumPreviousNumber = 0): Promise<PurchaseDocument> {
    const db = await getDatabase();
    let documentNumber = 0;
    await db.withExclusiveTransactionAsync(async (txn) => {
      const row = await txn.getFirstAsync<{ maxNum: number }>(
        'SELECT COALESCE(MAX(documentNumber), 0) AS maxNum FROM purchase_documents WHERE type = ?',
        document.type,
      );
      documentNumber = Math.max(row?.maxNum ?? 0, minimumPreviousNumber) + 1;
      await txn.runAsync(
        `INSERT INTO purchase_documents
         (id, documentNumber, type, supplierId, supplierName, items, netAmount, ivaAmount, total, notes, pdfUri, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'draft', ?)`,
        document.id,
        documentNumber,
        document.type,
        document.supplierId,
        document.supplierName,
        JSON.stringify(document.items),
        document.netAmount,
        document.ivaAmount,
        document.total,
        document.notes ?? null,
        document.createdAt,
      );
    });
    return { ...document, documentNumber, status: 'draft' };
  }

  async attachPdf(id: string, pdfUri: string): Promise<void> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE purchase_documents SET pdfUri = ?, status = 'generated' WHERE id = ?`,
      pdfUri,
      id,
    );
    if (result.changes !== 1) throw new Error('No se pudo guardar el PDF en el historial');
  }

  async findAll(): Promise<PurchaseDocument[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PurchaseDocumentRow>(
      `SELECT id, documentNumber, type, supplierId, supplierName, items, netAmount, ivaAmount, total, notes, pdfUri, status, createdAt
       FROM purchase_documents WHERE status = 'generated' ORDER BY createdAt DESC`,
    );
    return rows.map(toEntity);
  }

  async findById(id: string): Promise<PurchaseDocument | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PurchaseDocumentRow>(
      `SELECT id, documentNumber, type, supplierId, supplierName, items, netAmount, ivaAmount, total, notes, pdfUri, status, createdAt
       FROM purchase_documents WHERE id = ?`,
      id,
    );
    return row ? toEntity(row) : null;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const current = await this.findById(id);
    await db.runAsync(
      `UPDATE purchase_documents SET status = 'deleted', pdfUri = NULL WHERE id = ?`,
      id,
    );
    if (!current?.pdfUri) return;
    try {
      const file = new File(current.pdfUri);
      if (file.exists) file.delete();
    } catch {
      // El historial se elimina aunque el archivo ya no exista.
    }
  }
}
