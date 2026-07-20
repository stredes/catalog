import { CartItem } from '../../domain/entities/CartItem';
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
      updated = items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity, subtotal: (i.quantity + item.quantity) * i.unitPrice }
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
        ? { ...i, quantity, subtotal: quantity * i.unitPrice }
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
