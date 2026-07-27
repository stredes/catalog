import { CartItem } from '../../domain/entities/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';

export class GetCartItemsUseCase {
  constructor(private cart: CartRepository) {}

  async execute(): Promise<CartItem[]> {
    return this.cart.getItems();
  }
}
