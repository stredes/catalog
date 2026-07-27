import { CartItem } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';

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
