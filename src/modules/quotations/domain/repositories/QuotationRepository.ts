import { Quotation, QuotationStatus } from '../entities/Quotation';

export interface QuotationRepository {
  save(quotation: Quotation): Promise<void>;
  update(quotation: Quotation): Promise<void>;
  findAll(): Promise<Quotation[]>;
  findById(id: string): Promise<Quotation | null>;
  findByStatus(status: QuotationStatus): Promise<Quotation[]>;
  delete(id: string): Promise<void>;
  getMaxQuotationNumber(): Promise<number>;
}
