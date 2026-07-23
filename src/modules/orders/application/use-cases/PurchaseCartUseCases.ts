import { PurchaseCartItem, calculatePurchaseSubtotal } from '../../domain/entities/PurchaseCartItem';
import { PurchaseCartRepository } from '../../domain/repositories/PurchaseCartRepository';

export class GetPurchaseCartItemsUseCase {
  constructor(private cart: PurchaseCartRepository) {}

  async execute(): Promise<PurchaseCartItem[]> {
    return this.cart.getItems();
  }
}

export class AddToPurchaseCartUseCase {
  constructor(private cart: PurchaseCartRepository) {}

  async execute(item: PurchaseCartItem): Promise<PurchaseCartItem[]> {
    const items = await this.cart.getItems();
    const existing = items.find((i) => i.productId === item.productId);

    let updated: PurchaseCartItem[];
    if (existing) {
      const newQty = existing.quantity + item.quantity;
      updated = items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: newQty, subtotal: calculatePurchaseSubtotal(i.unitPrice, newQty, i.discountType, i.discountValue) }
          : i,
      );
    } else {
      updated = [...items, item];
    }

    await this.cart.saveItems(updated);
    return updated;
  }
}

export class UpdatePurchaseCartItemUseCase {
  constructor(private cart: PurchaseCartRepository) {}

  async execute(productId: string, quantity: number): Promise<PurchaseCartItem[]> {
    const items = await this.cart.getItems();

    if (quantity <= 0) {
      const filtered = items.filter((i) => i.productId !== productId);
      await this.cart.saveItems(filtered);
      return filtered;
    }

    const updated = items.map((i) =>
      i.productId === productId
        ? { ...i, quantity, subtotal: calculatePurchaseSubtotal(i.unitPrice, quantity, i.discountType, i.discountValue) }
        : i,
    );

    await this.cart.saveItems(updated);
    return updated;
  }
}

export class UpdatePurchaseCartItemDiscountUseCase {
  constructor(private cart: PurchaseCartRepository) {}

  async execute(productId: string, discountType: PurchaseCartItem['discountType'], discountValue: number): Promise<PurchaseCartItem[]> {
    const items = await this.cart.getItems();
    const updated = items.map((i) =>
      i.productId === productId
        ? { ...i, discountType, discountValue, subtotal: calculatePurchaseSubtotal(i.unitPrice, i.quantity, discountType, discountValue) }
        : i,
    );

    await this.cart.saveItems(updated);
    return updated;
  }
}

export class RemoveFromPurchaseCartUseCase {
  constructor(private cart: PurchaseCartRepository) {}

  async execute(productId: string): Promise<PurchaseCartItem[]> {
    const items = await this.cart.getItems();
    const filtered = items.filter((i) => i.productId !== productId);
    await this.cart.saveItems(filtered);
    return filtered;
  }
}

export class ClearPurchaseCartUseCase {
  constructor(private cart: PurchaseCartRepository) {}

  async execute(): Promise<void> {
    await this.cart.clear();
  }
}
