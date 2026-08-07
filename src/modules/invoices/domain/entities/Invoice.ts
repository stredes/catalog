export type InvoiceStatus = 'pending' | 'paid';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  description?: string;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentDate?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvoiceInput = {
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  description?: string;
  netAmount: number;
  status?: InvoiceStatus;
  paymentDate?: string;
};
