import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { OrderSchema } from '../../../../shared/validation/schemas';

type OrderRow = {
  id: string;
  orderNumber: number;
  clientName: string;
  clientId: string | null;
  items: string;
  subtotal: number;
  iva: number;
  total: number;
  status: string;
  paidAmount: number;
  notes: string | null;
  createdAt: string;
};

function rowToOrder(row: OrderRow): Order {
  let items: Order['items'];
  try {
    const parsed: unknown = JSON.parse(row.items);
    items = Array.isArray(parsed) ? parsed as Order['items'] : [];
  } catch {
    items = [];
  }

  const validStatus: OrderStatus = (['pending', 'partial', 'paid'].includes(row.status) ? row.status : 'pending') as OrderStatus;

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    clientName: row.clientName,
    clientId: row.clientId ?? undefined,
    items,
    subtotal: row.subtotal,
    iva: row.iva,
    total: row.total,
    status: validStatus,
    paidAmount: row.paidAmount ?? (row.status === 'paid' ? row.total : 0),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class SQLiteOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO orders (id, orderNumber, clientName, clientId, items, subtotal, iva, total, status, paidAmount, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      order.id,
      order.orderNumber,
      order.clientName,
      order.clientId ?? null,
      JSON.stringify(order.items),
      order.subtotal,
      order.iva,
      order.total,
      order.status ?? 'pending',
      order.paidAmount ?? 0,
      order.notes ?? null,
      order.createdAt,
    );
  }

  async update(order: Order): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE orders SET clientName = ?, clientId = ?, items = ?, subtotal = ?, iva = ?, total = ?, status = ?, paidAmount = ?, notes = ? WHERE id = ?`,
      order.clientName,
      order.clientId ?? null,
      JSON.stringify(order.items),
      order.subtotal,
      order.iva,
      order.total,
      order.status ?? 'pending',
      order.paidAmount ?? 0,
      order.notes ?? null,
      order.id,
    );
  }

  async findAll(): Promise<Order[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<OrderRow>(
      'SELECT id, orderNumber, clientName, clientId, items, subtotal, iva, total, status, paidAmount, notes, createdAt FROM orders ORDER BY createdAt DESC',
    );
    return rows.map(rowToOrder);
  }

  async findById(id: string): Promise<Order | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<OrderRow>(
      'SELECT id, orderNumber, clientName, clientId, items, subtotal, iva, total, status, paidAmount, notes, createdAt FROM orders WHERE id = ?',
      id,
    );
    return row ? rowToOrder(row) : null;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM orders WHERE id = ?', id);
  }

  async deleteAndRestoreStock(id: string): Promise<void> {
    const db = await getDatabase();

    await db.withExclusiveTransactionAsync(async (txn) => {
      const row = await txn.getFirstAsync<OrderRow>(
        'SELECT id, orderNumber, clientName, clientId, items, subtotal, iva, total, status, paidAmount, notes, createdAt FROM orders WHERE id = ?',
        id,
      );
      if (!row) {
        throw new Error('Pedido no encontrado');
      }

      const order = rowToOrder(row);
      if (order.items.length === 0) {
        throw new Error('El pedido no contiene productos válidos para devolver al stock');
      }

      for (const item of order.items) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error(`Cantidad inválida en el pedido para producto ${item.productId}`);
        }

        const result = await txn.runAsync(
          'UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?',
          item.quantity,
          new Date().toISOString(),
          item.productId,
        );
        if (result.changes === 0) {
          throw new Error(`No se encontró el producto ${item.productId}; el pedido no fue eliminado`);
        }
      }

      const deleted = await txn.runAsync('DELETE FROM orders WHERE id = ?', id);
      if (deleted.changes !== 1) {
        throw new Error('No se pudo eliminar el pedido');
      }
    });
  }

  async getMaxOrderNumber(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ maxNum: number }>(
      'SELECT COALESCE(MAX(orderNumber), 0) as maxNum FROM orders',
    );
    return row?.maxNum ?? 0;
  }

  async saveAndDecrementStock(
    order: Order,
    stockChanges: Array<{ productId: string; quantity: number }>,
    clearCart?: () => Promise<void>,
  ): Promise<{ orderNumber: number }> {
    const db = await getDatabase();
    let assignedOrderNumber = 0;
    await db.withExclusiveTransactionAsync(async (txn) => {
      const maxRow = await txn.getFirstAsync<{ maxNum: number }>(
        'SELECT COALESCE(MAX(orderNumber), 0) as maxNum FROM orders',
      );
      assignedOrderNumber = (maxRow?.maxNum ?? 0) + 1;

      await txn.runAsync(
        `INSERT INTO orders (id, orderNumber, clientName, clientId, items, subtotal, iva, total, status, paidAmount, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        order.id,
        assignedOrderNumber,
        order.clientName,
        order.clientId ?? null,
        JSON.stringify(order.items),
        order.subtotal,
        order.iva,
        order.total,
        order.status ?? 'pending',
        order.paidAmount ?? 0,
        order.notes ?? null,
        order.createdAt,
      );

      for (const change of stockChanges) {
        const result = await txn.runAsync(
          'UPDATE products SET stock = stock - ?, updatedAt = ? WHERE id = ? AND stock >= ?',
          change.quantity,
          new Date().toISOString(),
          change.productId,
          change.quantity,
        );
        if (result.changes === 0) {
          throw new Error(`Stock insuficiente para producto ${change.productId}: no se pudo descontar ${change.quantity} unidades`);
        }
      }

      if (clearCart) {
        await clearCart();
      }
    });
    return { orderNumber: assignedOrderNumber };
  }
}
