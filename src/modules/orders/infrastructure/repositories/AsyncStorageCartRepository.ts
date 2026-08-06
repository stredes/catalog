import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateSubtotal, CartItem, DiscountType } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { CartItemSchema } from '../../../../shared/validation/schemas';

const CART_KEY = 'catalog_clean_cart';

export function normalizeStoredCartItem(raw: unknown): CartItem | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const candidate = raw as Record<string, unknown>;
  const rawDiscountType = candidate.discountType;
  const discountType: DiscountType =
    rawDiscountType === 'currency' || rawDiscountType === 'percentage'
      ? rawDiscountType
      : 'none';
  const discountValue =
    typeof candidate.discountValue === 'number' &&
    Number.isFinite(candidate.discountValue) &&
    candidate.discountValue >= 0
      ? candidate.discountValue
      : 0;

  const normalized = {
    ...candidate,
    productCode: typeof candidate.productCode === 'string' ? candidate.productCode : undefined,
    discountType,
    discountValue,
    subtotal:
      typeof candidate.unitPrice === 'number' && typeof candidate.quantity === 'number'
        ? calculateSubtotal(candidate.unitPrice, candidate.quantity, discountType, discountValue)
        : candidate.subtotal,
  };

  const result = CartItemSchema.safeParse(normalized);
  if (!result.success) return null;
  return {
    ...result.data,
    productCode: result.data.productCode ?? undefined,
  };
}

export class AsyncStorageCartRepository implements CartRepository {
  async getItems(): Promise<CartItem[]> {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(normalizeStoredCartItem)
        .filter((item): item is CartItem => item !== null);
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
