import { Order, OrderStatus } from '../../domain/entities/Order';
import { CartItem, calculateSubtotal } from '../../domain/entities/CartItem';
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

    for (const item of items) {
      if (!Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        throw new Error(`Cantidad inválida para "${item.productName}": ${item.quantity}`);
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
        throw new Error(`Precio inválido para "${item.productName}": ${item.unitPrice}`);
      }
      if (!Number.isFinite(item.subtotal) || item.subtotal < 0) {
        throw new Error(`Subtotal inválido para "${item.productName}": ${item.subtotal}`);
      }
      if (item.discountType === 'percentage') {
        if (!Number.isFinite(item.discountValue) || item.discountValue < 0 || item.discountValue > 100) {
          throw new Error(`Descuento porcentual inválido para "${item.productName}": ${item.discountValue}%`);
        }
      }
      if (item.discountType === 'currency') {
        if (!Number.isFinite(item.discountValue) || item.discountValue < 0) {
          throw new Error(`Descuento monetario inválido para "${item.productName}": ${item.discountValue}`);
        }
        const base = item.unitPrice * item.quantity;
        if (item.discountValue > base) {
          throw new Error(`El descuento no puede superar el subtotal para "${item.productName}"`);
        }
      }
    }

    const insufficientStock: Array<{ productName: string; requested: number; available: number }> = [];
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Producto "${item.productName}" no encontrado en inventario`);
      }
      if (product.stock < item.quantity) {
        insufficientStock.push({
          productName: item.productName,
          requested: item.quantity,
          available: product.stock,
        });
      }
    }

    if (insufficientStock.length > 0) {
      const details = insufficientStock
        .map((s) => `"${s.productName}": solicitado ${s.requested}, disponible ${s.available}`)
        .join('; ');
      throw new Error(`Stock insuficiente: ${details}`);
    }

    const orderItems = items.map((item) => ({
      ...item,
      subtotal: calculateSubtotal(item.unitPrice, item.quantity, item.discountType, item.discountValue),
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order: Order = {
      id: createId('order'),
      orderNumber: 0,
      clientName,
      items: orderItems,
      subtotal,
      iva: 0,
      total: subtotal,
      status: 'pending',
      paidAmount: 0,
      notes,
      createdAt: nowIso(),
    };

    const stockChanges = orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const { orderNumber } = await this.orderRepository.saveAndDecrementStock(
      order,
      stockChanges,
      () => this.cartRepository.clear(),
    );

    return { ...order, orderNumber };
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
    await this.orderRepository.deleteAndRestoreStock(id);
  }
}

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
      items: orderItems,
      subtotal,
      total: subtotal,
      notes: notes || undefined,
    };

    const stockDeltas = new Map<string, number>();
    for (const oldItem of existing.items) {
      stockDeltas.set(oldItem.productId, (stockDeltas.get(oldItem.productId) ?? 0) + oldItem.quantity);
    }
    for (const item of orderItems) {
      stockDeltas.set(item.productId, (stockDeltas.get(item.productId) ?? 0) - item.quantity);
    }

    const productNames = new Map<string, string>();
    for (const item of items) {
      productNames.set(item.productId, item.productName);
    }

    const changes: Array<{ productId: string; quantity: number }> = [];
    for (const [productId, delta] of stockDeltas) {
      if (delta === 0) continue;
      if (delta < 0) {
        const product = await this.productRepository.findById(productId);
        if (!product) {
          throw new Error(`Producto ${productId} no encontrado en inventario`);
        }
        if (product.stock < -delta) {
          const name = productNames.get(productId) ?? productId;
          throw new Error(`Stock insuficiente para "${name}": disponible ${product.stock}, requerido ${-delta}`);
        }
      }
      changes.push({ productId, quantity: delta });
    }

    await this.orderRepository.update(updated);
    if (changes.length > 0) {
      await this.productRepository.batchUpdateStock(changes);
    }

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
