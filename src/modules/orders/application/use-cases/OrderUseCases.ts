import { Order, OrderStatus } from '../../domain/entities/Order';
import { CartItem } from '../../domain/entities/CartItem';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { Profile } from '../../../profile/domain/entities/profile';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';

export class GenerateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private productRepository: ProductRepository,
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
      id: createId('order'),
      orderNumber,
      clientName,
      items,
      subtotal,
      iva: 0,
      total: subtotal,
      status: 'pending',
      paidAmount: 0,
      notes,
      createdAt: nowIso(),
    };

    await this.orderRepository.save(order);

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await this.productRepository.updateStock(item.productId, newStock);
      }
    }

    await this.cartRepository.clear();

    return order;
  }
}

export class GetOrdersUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }
}

export class DeleteOrderUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }
}

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

export class ToggleOrderStatusUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string): Promise<Order> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }

    const newStatus: OrderStatus = existing.status === 'paid' ? 'pending' : 'paid';
    const updated: Order = {
      ...existing,
      status: newStatus,
      paidAmount: newStatus === 'paid' ? existing.total : 0,
    };

    await this.orderRepository.update(updated);
    return updated;
  }
}

export class RecordPaymentUseCase {
  constructor(private orderRepository: OrderRepository) {}

  async execute(id: string, amount: number): Promise<Order> {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }

    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
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

export function formatOrderAsText(order: Order, profile: Profile | null): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════');
  lines.push('');

  if (profile) {
    if (profile.businessName) lines.push(`  ${profile.businessName.toUpperCase()}`);
    if (profile.ownerName) lines.push(`  Responsable: ${profile.ownerName}`);
    if (profile.phone) lines.push(`  Tel: ${profile.phone}`);
    if (profile.email) lines.push(`  Email: ${profile.email}`);
    if (profile.address) lines.push(`  Dir: ${profile.address}`);
    if (profile.website) lines.push(`  Web: ${profile.website}`);
    lines.push('');
    if (profile.bankName) lines.push(`  Banco: ${profile.bankName}`);
    if (profile.bankAccountType) lines.push(`  Tipo cuenta: ${profile.bankAccountType}`);
    if (profile.bankAccountNumber) lines.push(`  N° cuenta: ${profile.bankAccountNumber}`);
    lines.push('');
  }

  lines.push('  PEDIDO');
  lines.push('═══════════════════════════════════════');
  lines.push('');
  lines.push(`  Cliente: ${order.clientName}`);
  lines.push(`  Fecha:   ${new Date(order.createdAt).toLocaleString('es-CL')}`);
  lines.push(`  N° Pedido: ${String(order.orderNumber).padStart(4, '0')}`);
  lines.push(`  Estado: ${order.status === 'paid' ? 'PAGADO' : order.status === 'partial' ? 'PAGO PARCIAL' : 'PENDIENTE'}`);
  if (order.paidAmount > 0) {
    lines.push(`  Pagado: $${order.paidAmount.toLocaleString('es-CL')}`);
    lines.push(`  Saldo:  $${Math.max(0, order.total - order.paidAmount).toLocaleString('es-CL')}`);
  }
  lines.push('');
  lines.push('───────────────────────────────────────');

  order.items.forEach((item, index) => {
    const hasDiscount = item.discountType !== 'none' && item.discountValue > 0;
    lines.push(`  ${index + 1}. ${item.productName}`);
    if (item.productCode) lines.push(`     Codigo: ${item.productCode}`);
    if (hasDiscount) {
      const discountLabel = item.discountType === 'currency'
        ? `-$${item.discountValue.toLocaleString('es-CL')}`
        : `-${item.discountValue}%`;
      lines.push(`     Cant: ${item.quantity} x $${item.unitPrice.toLocaleString('es-CL')} = $${(item.unitPrice * item.quantity).toLocaleString('es-CL')} → Descuento ${discountLabel}`);
      lines.push(`     Subtotal: $${item.subtotal.toLocaleString('es-CL')}`);
    } else {
      lines.push(`     Cant: ${item.quantity} x $${item.unitPrice.toLocaleString('es-CL')} = $${item.subtotal.toLocaleString('es-CL')}`);
    }
    lines.push('');
  });

  lines.push('───────────────────────────────────────');
  lines.push(`  Subtotal:  $${order.subtotal.toLocaleString('es-CL')}`);
  lines.push(`  TOTAL:     $${order.total.toLocaleString('es-CL')}`);
  lines.push('───────────────────────────────────────');

  if (order.notes) {
    lines.push('');
    lines.push(`  Notas: ${order.notes}`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════');
  lines.push('  Gracias por su compra');
  lines.push('═══════════════════════════════════════');

  return lines.join('\n');
}
