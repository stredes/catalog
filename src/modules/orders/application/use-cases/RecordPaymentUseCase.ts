import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

export class RecordPaymentUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string, amount: number): Promise<Order> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('El monto debe ser un número finito mayor a 0');
    }

    const currentPaidAmount = existing.paidAmount ?? (existing.status === 'paid' ? existing.total : 0);
    const remainingAmount = Math.max(0, existing.total - currentPaidAmount);
    if (remainingAmount === 0) {
      throw new Error('El pedido ya esta pagado');
    }
    if (amount > remainingAmount) {
      throw new Error('El pago no puede superar el saldo pendiente');
    }

    const newPaidAmount = currentPaidAmount + amount;
    const newStatus: OrderStatus = newPaidAmount >= existing.total
      ? 'paid'
      : newPaidAmount > 0
        ? 'partial'
        : 'pending';

    const updated: Order = {
      ...existing,
      paidAmount: newPaidAmount,
      status: newStatus,
    };

    await this.orderRepository.update(updated);
    return updated;
  }
}
