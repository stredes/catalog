import { CartItem } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';

export class RemoveFromCartUseCase {
  constructor(private cart: CartRepository) {}

  async execute(productId: string): Promise<CartItem[]> {
    const items = await this.cart.getItems();
    const filtered = items.filter((i) => i.productId !== productId);
    await this.cart.saveItems(filtered);
    return filtered;
  }
}
