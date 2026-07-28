import { Order } from '../../domain/entities/Order';
import { CartItem, calculateSubtotal } from '../../domain/entities/CartItem';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';

export class GenerateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private productRepository: ProductRepository,
  ) {}

  async execute(clientName: string, notes?: string, clientId?: string): Promise<Order> {
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
      clientId,
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
