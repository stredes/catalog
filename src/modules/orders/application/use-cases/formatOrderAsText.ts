import { Order } from '../../domain/entities/Order';
import { Profile } from '../../../profile/domain/entities/profile';

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
