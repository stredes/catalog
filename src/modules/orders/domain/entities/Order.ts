import { CartItem } from './CartItem';

export type OrderStatus = 'pending' | 'partial' | 'paid';

export type Order = {
  id: string;
  orderNumber: number;
  clientName: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
  status: OrderStatus;
  paidAmount: number;
  notes?: string;
  createdAt: string;
};
