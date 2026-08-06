import { NewPurchaseDocument, PurchaseDocument } from '../entities/PurchaseDocument';

export interface PurchaseDocumentRepository {
  createDraft(document: NewPurchaseDocument, minimumPreviousNumber?: number): Promise<PurchaseDocument>;
  attachPdf(id: string, pdfUri: string): Promise<void>;
  findAll(): Promise<PurchaseDocument[]>;
  findById(id: string): Promise<PurchaseDocument | null>;
  delete(id: string): Promise<void>;
}
