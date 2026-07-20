import { Order } from '../../domain/entities/Order';
import { CartItem } from '../../domain/entities/CartItem';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { Profile } from '../../../profile/domain/entities/profile';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';

const IVA_RATE = 0.19;

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
    const iva = Math.round(subtotal * IVA_RATE);
    const total = subtotal + iva;

    const order: Order = {
      id: createId('order'),
      clientName,
      items,
      subtotal,
      iva,
      total,
      notes,
      createdAt: nowIso(),
    };

    await this.orderRepository.save(order);
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

  lines.push('  ORDEN DE COMPRA');
  lines.push('═══════════════════════════════════════');
  lines.push('');
  lines.push(`  Cliente: ${order.clientName}`);
  lines.push(`  Fecha:   ${new Date(order.createdAt).toLocaleString('es-CL')}`);
  lines.push(`  N° Orden: ${order.id}`);
  lines.push('');
  lines.push('───────────────────────────────────────');

  order.items.forEach((item, index) => {
    lines.push(`  ${index + 1}. ${item.productName}`);
    if (item.productCode) lines.push(`     Codigo: ${item.productCode}`);
    lines.push(`     Cant: ${item.quantity} x $${item.unitPrice.toLocaleString('es-CL')} = $${item.subtotal.toLocaleString('es-CL')}`);
    lines.push('');
  });

  lines.push('───────────────────────────────────────');
  lines.push(`  Subtotal sin IVA:  $${order.subtotal.toLocaleString('es-CL')}`);
  lines.push(`  IVA (19%):         $${order.iva.toLocaleString('es-CL')}`);
  lines.push(`  TOTAL:             $${order.total.toLocaleString('es-CL')}`);
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
