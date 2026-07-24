import AsyncStorage from '@react-native-async-storage/async-storage';
import { PurchaseCartItem } from '../../domain/entities/PurchaseCartItem';
import { PurchaseCartRepository } from '../../domain/repositories/PurchaseCartRepository';
import { z } from 'zod';
import { MoneySchema, StrictPositiveInteger } from '../../../../shared/validation/schemas';

const PURCHASE_CART_KEY = 'catalog_clean_purchase_cart';

const PurchaseCartItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productCode: z.string().optional(),
  unitPrice: MoneySchema.positive(),
  quantity: StrictPositiveInteger,
  format: z.string().min(1),
  discountType: z.enum(['none', 'currency', 'percentage']),
  discountValue: z.number().finite().nonnegative(),
  subtotal: MoneySchema,
});

export class AsyncStoragePurchaseCartRepository implements PurchaseCartRepository {
  async getItems(): Promise<PurchaseCartItem[]> {
    const raw = await AsyncStorage.getItem(PURCHASE_CART_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => PurchaseCartItemSchema.safeParse(item).success) as PurchaseCartItem[];
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
