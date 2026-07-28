import { ServiceItem } from './ServiceItem';

export type QuotationStatus = 'pending' | 'accepted' | 'paid' | 'rejected' | 'deleted';

export type Quotation = {
  id: string;
  quotationNumber: number;
  clientName: string;
  clientRut?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  items: ServiceItem[];
  subtotal: number;
  ivaRate: number;
  ivaAmount: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  validUntil?: string;
  createdAt: string;
};

export const IVA_RATE = 19;
