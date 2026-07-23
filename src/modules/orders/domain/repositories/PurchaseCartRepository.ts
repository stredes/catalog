import { PurchaseCartItem } from '../entities/PurchaseCartItem';

export interface PurchaseCartRepository {
  getItems(): Promise<PurchaseCartItem[]>;
  saveItems(items: PurchaseCartItem[]): Promise<void>;
  clear(): Promise<void>;
}
