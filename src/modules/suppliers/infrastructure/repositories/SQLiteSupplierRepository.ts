import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Supplier } from '../../domain/entities/Supplier';
import { SupplierRepository } from '../../domain/repositories/SupplierRepository';

export class SQLiteSupplierRepository implements SupplierRepository {
  async create(supplier: Supplier) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO suppliers (id, name, phone, email, contactName, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      supplier.id,
      supplier.name,
      supplier.phone ?? null,
      supplier.email ?? null,
      supplier.contactName ?? null,
      supplier.notes ?? null,
      supplier.createdAt,
      supplier.updatedAt,
    );
  }

  async update(supplier: Supplier) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE suppliers
       SET name = ?, phone = ?, email = ?, contactName = ?, notes = ?, updatedAt = ?
       WHERE id = ?`,
      supplier.name,
      supplier.phone ?? null,
      supplier.email ?? null,
      supplier.contactName ?? null,
      supplier.notes ?? null,
      supplier.updatedAt,
      supplier.id,
    );
  }

  async delete(id: string) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM suppliers WHERE id = ?', id);
  }

  async findAll() {
    const db = await getDatabase();
    return db.getAllAsync<Supplier>('SELECT * FROM suppliers ORDER BY createdAt DESC');
  }

  async findById(id: string) {
    const db = await getDatabase();
    return db.getFirstAsync<Supplier>('SELECT * FROM suppliers WHERE id = ?', id);
  }
}
