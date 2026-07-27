import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class DeleteOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string): Promise<void> {
    await this.orderRepository.deleteAndRestoreStock(id);
  }
}
