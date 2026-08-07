import { NewPurchaseDocument, PurchaseDocument, PurchaseOrderStatus } from '../entities/PurchaseDocument';

export interface PurchaseDocumentRepository {
  createDraft(document: NewPurchaseDocument, minimumPreviousNumber?: number): Promise<PurchaseDocument>;
  create(document: PurchaseDocument): Promise<void>;
  attachPdf(id: string, pdfUri: string): Promise<void>;
  findAll(): Promise<PurchaseDocument[]>;
  findById(id: string): Promise<PurchaseDocument | null>;
  delete(id: string): Promise<void>;
  setOrderStatus(id: string, status: PurchaseOrderStatus): Promise<void>;
  approvePurchaseOrder(id: string): Promise<void>;
}
