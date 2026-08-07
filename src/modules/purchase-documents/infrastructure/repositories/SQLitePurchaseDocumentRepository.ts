import { File } from 'expo-file-system';
import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { NewPurchaseDocument, PurchaseDocument, PurchaseDocumentStatus, PurchaseDocumentType, PurchaseOrderStatus } from '../../domain/entities/PurchaseDocument';
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
  orderStatus: string;
  createdAt: string;
};

const PURCHASE_DOCUMENT_COLUMNS =
  'id, documentNumber, type, supplierId, supplierName, items, netAmount, ivaAmount, total, notes, pdfUri, status, orderStatus, createdAt';

function toEntity(row: PurchaseDocumentRow): PurchaseDocument {
  let items: PurchaseDocument['items'] = [];
  try {
    const parsed: unknown = JSON.parse(row.items);
    if (Array.isArray(parsed)) items = parsed as PurchaseDocument['items'];
  } catch {
    items = [];
  }
  const validOrderStatus: PurchaseOrderStatus = (
    ['pending', 'approved', 'cancelled'].includes(row.orderStatus)
      ? row.orderStatus
      : 'pending'
  ) as PurchaseOrderStatus;
  return {
    id: row.id,
    documentNumber: row.documentNumber,
    type: row.type as PurchaseDocumentType,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    items,
    netAmount: row.netAmount,
    ivaAmount: row.ivaAmount,
    total: row.total,
    notes: row.notes ?? undefined,
    pdfUri: row.pdfUri ?? undefined,
    status: row.status as PurchaseDocumentStatus,
    orderStatus: validOrderStatus,
    createdAt: row.createdAt,
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
         (id, documentNumber, type, supplierId, supplierName, items, netAmount, ivaAmount, total, notes, pdfUri, status, orderStatus, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'draft', 'pending', ?)`,
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
    return { ...document, documentNumber, status: 'draft', orderStatus: 'pending' };
  }

  async create(document: PurchaseDocument): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO purchase_documents
       (id, documentNumber, type, supplierId, supplierName, items, netAmount, ivaAmount, total, notes, pdfUri, status, orderStatus, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      document.id,
      document.documentNumber,
      document.type,
      document.supplierId,
      document.supplierName,
      JSON.stringify(document.items),
      document.netAmount,
      document.ivaAmount,
      document.total,
      document.notes ?? null,
      document.pdfUri ?? null,
      document.status,
      document.orderStatus,
      document.createdAt,
    );
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
      `SELECT ${PURCHASE_DOCUMENT_COLUMNS}
       FROM purchase_documents WHERE status = 'generated' ORDER BY createdAt DESC`,
    );
    return rows.map(toEntity);
  }

  async findById(id: string): Promise<PurchaseDocument | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PurchaseDocumentRow>(
      `SELECT ${PURCHASE_DOCUMENT_COLUMNS}
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

  async setOrderStatus(id: string, status: PurchaseOrderStatus): Promise<void> {
    const db = await getDatabase();
    const result = await db.runAsync(
      `UPDATE purchase_documents SET orderStatus = ? WHERE id = ?`,
      status,
      id,
    );
    if (result.changes !== 1) throw new Error('No se pudo actualizar el estado de la orden');
  }

  async approvePurchaseOrder(id: string): Promise<void> {
    const db = await getDatabase();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const row = await txn.getFirstAsync<PurchaseDocumentRow>(
        `SELECT ${PURCHASE_DOCUMENT_COLUMNS} FROM purchase_documents WHERE id = ?`,
        id,
      );
      if (!row) throw new Error('Orden de compra no encontrada');
      if (row.type !== 'purchase-order') throw new Error('Solo las órdenes de compra suman stock');
      if (row.orderStatus === 'approved') throw new Error('La orden ya fue aprobada');
      if (row.orderStatus === 'cancelled') throw new Error('La orden fue cancelada y no se puede aprobar');

      const document = toEntity(row);
      if (document.items.length === 0) {
        throw new Error('La orden no contiene productos válidos para sumar stock');
      }

      for (const item of document.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error(`Cantidad inválida en la orden para producto ${item.productId}`);
        }

        const result = await txn.runAsync(
          'UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?',
          item.quantity,
          new Date().toISOString(),
          item.productId,
        );
        if (result.changes === 0) {
          throw new Error(`No se encontró el producto ${item.productId}; la orden no fue aprobada`);
        }
      }

      const updated = await txn.runAsync(
        `UPDATE purchase_documents SET orderStatus = 'approved' WHERE id = ?`,
        id,
      );
      if (updated.changes !== 1) {
        throw new Error('No se pudo aprobar la orden de compra');
      }
    });
  }
}
