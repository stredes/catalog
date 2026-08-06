import { CartItem } from './CartItem';

export type OrderStatus = 'pending' | 'partial' | 'paid';
export type OrderDocumentType = 'quotation' | 'purchase-order';

export type Order = {
  id: string;
  orderNumber: number;
  clientName: string;
  clientId?: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
  status: OrderStatus;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  documentType?: OrderDocumentType;
};
