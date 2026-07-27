import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class ToggleOrderStatusUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string): Promise<Order> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }

    let newStatus: OrderStatus;
    let newPaidAmount: number;

    if (existing.status === 'pending') {
      newStatus = 'paid';
      newPaidAmount = existing.total;
    } else if (existing.status === 'paid') {
      newStatus = 'partial';
      newPaidAmount = existing.paidAmount || existing.total;
    } else {
      newStatus = 'pending';
      newPaidAmount = 0;
    }

    const updated: Order = {
      ...existing,
      status: newStatus,
      paidAmount: newPaidAmount,
    };

    await this.orderRepository.update(updated);
    return updated;
  }
}
