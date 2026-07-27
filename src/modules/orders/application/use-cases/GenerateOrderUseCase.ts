import { Order } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';

export class GenerateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
  ) {}

  async execute(clientName: string, notes?: string): Promise<Order> {
    const items = await this.cartRepository.getItems();

    if (items.length === 0) {
      throw new Error('El carrito esta vacio');
    }

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    const existingOrders = await this.orderRepository.findAll();
    const orderNumber = existingOrders.length + 1;

    const order: Order = {
      status: 'pending',
      paidAmount: 0,
      id: createId('order'),
      orderNumber,
      clientName,
      items,
      subtotal,
      iva: 0,
      total: subtotal,
      notes,
      createdAt: nowIso(),
    };

    await this.orderRepository.save(order);
    await this.cartRepository.clear();

    return order;
  }
}
