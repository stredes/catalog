import { CartItem } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';

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
