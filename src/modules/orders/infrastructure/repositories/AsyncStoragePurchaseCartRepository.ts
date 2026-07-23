import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchaseCartItem } from '../../domain/entities/PurchaseCartItem';
import { PurchaseCartRepository } from '../../domain/repositories/PurchaseCartRepository';

const PURCHASE_CART_KEY = 'catalog_clean_purchase_cart';

export class AsyncStoragePurchaseCartRepository implements PurchaseCartRepository {
  async getItems(): Promise<PurchaseCartItem[]> {
    const raw = await AsyncStorage.getItem(PURCHASE_CART_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PurchaseCartItem[];
    } catch {
      return [];
    }
  }

  async saveItems(items: PurchaseCartItem[]): Promise<void> {
    await AsyncStorage.setItem(PURCHASE_CART_KEY, JSON.stringify(items));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(PURCHASE_CART_KEY);
  }
}
