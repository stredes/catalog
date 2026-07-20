import { CartItem } from '../entities/CartItem';

export interface CartRepository {
  getItems(): Promise<CartItem[]>;
  saveItems(items: CartItem[]): Promise<void>;
  clear(): Promise<void>;
}
