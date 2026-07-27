import { Order } from '../../domain/entities/Order';
import { CartItem } from '../../domain/entities/CartItem';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class UpdateOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(
    id: string,
    clientName: string,
    items: CartItem[],
    notes?: string,
  ): Promise<Order> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }

    if (items.length === 0) {
      throw new Error('El pedido debe tener al menos un producto');
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    const updated: Order = {
      ...existing,
      clientName,
      items,
      subtotal,
      total: subtotal,
      notes: notes || undefined,
    };

    await this.orderRepository.update(updated);
    return updated;
  }
}
