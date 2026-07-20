import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';

const CART_KEY = 'catalog_clean_cart';

export class AsyncStorageCartRepository implements CartRepository {
  async getItems(): Promise<CartItem[]> {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }

  async saveItems(items: CartItem[]): Promise<void> {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(CART_KEY);
  }
}
