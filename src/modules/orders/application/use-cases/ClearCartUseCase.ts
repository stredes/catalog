import { CartRepository } from '../../domain/repositories/CartRepository';

export class ClearCartUseCase {
  constructor(private cart: CartRepository) {}

  async execute(): Promise<void> {
    await this.cart.clear();
  }
}
