import { PurchaseCartItem } from '../../../orders/domain/entities/PurchaseCartItem';

export type PurchaseDocumentType = 'quotation' | 'purchase-order';
export type PurchaseDocumentStatus = 'draft' | 'generated' | 'deleted';

export type PurchaseDocument = {
  id: string;
  documentNumber: number;
  type: PurchaseDocumentType;
  supplierId: string;
  supplierName: string;
  items: PurchaseCartItem[];
  netAmount: number;
  ivaAmount: number;
  total: number;
  notes?: string;
  pdfUri?: string;
  status: PurchaseDocumentStatus;
  createdAt: string;
};

export type NewPurchaseDocument = Omit<PurchaseDocument, 'documentNumber' | 'pdfUri' | 'status'>;

export function calculatePurchaseTaxes(netAmount: number, ivaRate = 0.19) {
  const safeNetAmount = Math.max(0, netAmount);
  const ivaAmount = Math.round(safeNetAmount * ivaRate);
  return { netAmount: safeNetAmount, ivaAmount, total: safeNetAmount + ivaAmount };
}
