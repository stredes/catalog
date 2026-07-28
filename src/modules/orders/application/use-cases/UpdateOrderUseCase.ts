import { Order } from '../../domain/entities/Order';
import { CartItem, calculateSubtotal } from '../../domain/entities/CartItem';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';

export class UpdateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private productRepository: ProductRepository,
  ) {}

  async execute(
    id: string,
    clientName: string,
    items: CartItem[],
    notes?: string,
    clientId?: string,
  ): Promise<Order> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }

    if (items.length === 0) {
      throw new Error('El pedido debe tener al menos un producto');
    }

    const orderItems = items.map((item) => ({
      ...item,
      subtotal: calculateSubtotal(item.unitPrice, item.quantity, item.discountType, item.discountValue),
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const updated: Order = {
      ...existing,
      clientName,
      clientId: clientId ?? existing.clientId,
      items: orderItems,
      subtotal,
      total: subtotal,
      notes: notes || undefined,
    };

    await this.orderRepository.update(updated);

    for (const oldItem of existing.items) {
      const product = await this.productRepository.findById(oldItem.productId);
      if (product) {
        await this.productRepository.updateStock(product.id, product.stock + oldItem.quantity);
      }
    }

    for (const item of orderItems) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Stock insuficiente para "${item.productName}": disponible ${product.stock}, requerido ${item.quantity}`);
        }
        await this.productRepository.updateStock(product.id, newStock);
      }
    }

    return updated;
  }
}
