import { Invoice, InvoiceStatus } from '../entities/Invoice';

export interface InvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  update(invoice: Invoice): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findAll(): Promise<Invoice[]>;
  delete(id: string): Promise<void>;
  existsByInvoiceNumber(invoiceNumber: string, excludedId?: string): Promise<boolean>;
  updateStatus(id: string, status: InvoiceStatus, paymentDate?: string): Promise<Invoice>;
}
