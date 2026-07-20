import { CartItem } from './CartItem';

export type Order = {
  id: string;
  clientName: string;
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
  notes?: string;
  createdAt: string;
};
