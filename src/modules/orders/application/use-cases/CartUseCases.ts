import { CartItem, calculateSubtotal } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';

export class GetCartItemsUseCase {
  constructor(private cart: CartRepository) {}

  async execute(): Promise<CartItem[]> {
    return this.cart.getItems();
  }
}

export class AddToCartUseCase {
  constructor(private cart: CartRepository) {}

  async execute(item: CartItem): Promise<CartItem[]> {
    const items = await this.cart.getItems();
    const existing = items.find((i) => i.productId === item.productId);

    let updated: CartItem[];
    if (existing) {
      const newQty = existing.quantity + item.quantity;
      updated = items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: newQty, subtotal: calculateSubtotal(i.unitPrice, newQty, i.discountType, i.discountValue) }
          : i,
      );
    } else {
      updated = [...items, item];
    }

    await this.cart.saveItems(updated);
    return updated;
  }
}

export class UpdateCartItemUseCase {
  constructor(private cart: CartRepository) {}

  async execute(productId: string, quantity: number): Promise<CartItem[]> {
    const items = await this.cart.getItems();

    if (quantity <= 0) {
      const filtered = items.filter((i) => i.productId !== productId);
      await this.cart.saveItems(filtered);
      return filtered;
    }

    const updated = items.map((i) =>
      i.productId === productId
        ? { ...i, quantity, subtotal: calculateSubtotal(i.unitPrice, quantity, i.discountType, i.discountValue) }
        : i,
    );

    await this.cart.saveItems(updated);
    return updated;
  }
}

export class UpdateCartItemDiscountUseCase {
  constructor(private cart: CartRepository) {}

  async execute(productId: string, discountType: CartItem['discountType'], discountValue: number): Promise<CartItem[]> {
    const items = await this.cart.getItems();
    const updated = items.map((i) =>
      i.productId === productId
        ? { ...i, discountType, discountValue, subtotal: calculateSubtotal(i.unitPrice, i.quantity, discountType, discountValue) }
        : i,
    );

    await this.cart.saveItems(updated);
    return updated;
  }
}

export class RemoveFromCartUseCase {
  constructor(private cart: CartRepository) {}

  async execute(productId: string): Promise<CartItem[]> {
    const items = await this.cart.getItems();
    const filtered = items.filter((i) => i.productId !== productId);
    await this.cart.saveItems(filtered);
    return filtered;
  }
}

export class ClearCartUseCase {
  constructor(private cart: CartRepository) {}

  async execute(): Promise<void> {
    await this.cart.clear();
  }
}
