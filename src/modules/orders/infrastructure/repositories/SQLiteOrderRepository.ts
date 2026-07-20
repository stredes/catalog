import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Order } from '../../domain/entities/Order';
import { OrderRepository } from '../../domain/repositories/OrderRepository';

type OrderRow = {
  id: string;
  clientName: string;
  items: string;
  subtotal: number;
  iva: number;
  total: number;
  notes: string | null;
  createdAt: string;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    clientName: row.clientName,
    items: JSON.parse(row.items),
    subtotal: row.subtotal,
    iva: row.iva,
    total: row.total,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

export class SQLiteOrderRepository implements OrderRepository {
  async save(order: Order): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO orders (id, clientName, items, subtotal, iva, total, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      order.id,
      order.clientName,
      JSON.stringify(order.items),
      order.subtotal,
      order.iva,
      order.total,
      order.notes ?? null,
      order.createdAt,
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
