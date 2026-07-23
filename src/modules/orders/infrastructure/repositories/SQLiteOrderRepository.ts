import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

type OrderRow = {
  id: string;
  orderNumber: number;
  clientName: string;
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
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    clientName: row.clientName,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    iva: row.iva,
    total: row.total,
    status: (['pending', 'partial', 'paid'].includes(row.status) ? row.status : 'pending') as OrderStatus,
    paidAmount: row.paidAmount ?? (row.status === 'paid' ? row.total : 0),
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class SQLiteOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO orders (id, orderNumber, clientName, items, subtotal, iva, total, status, paidAmount, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      order.id,
      order.orderNumber,
      order.clientName,
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
      `UPDATE orders SET clientName = ?, items = ?, subtotal = ?, iva = ?, total = ?, status = ?, paidAmount = ?, notes = ? WHERE id = ?`,
      order.clientName,
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
      'SELECT * FROM orders ORDER BY createdAt DESC',
    );
    return rows.map(rowToOrder);
  }

  async findById(id: string): Promise<Order | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<OrderRow>(
      'SELECT * FROM orders WHERE id = ?',
      id,
    );
    return row ? rowToOrder(row) : null;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM orders WHERE id = ?', id);
  }
}
