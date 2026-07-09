import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

export class SQLiteProductRepository implements ProductRepository {
  async create(product: Product) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO products
       (id, name, code, price, format, photoUri, familyId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      product.id,
      product.name,
      product.code ?? null,
      product.price,
      product.format,
      product.photoUri ?? null,
      product.familyId,
      product.createdAt,
      product.updatedAt,
    );
  }

  async update(product: Product) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE products
       SET name = ?, code = ?, price = ?, format = ?, photoUri = ?, familyId = ?, updatedAt = ?
       WHERE id = ?`,
      product.name,
      product.code ?? null,
      product.price,
      product.format,
      product.photoUri ?? null,
      product.familyId,
      product.updatedAt,
      product.id,
    );
  }

  async delete(id: string) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM products WHERE id = ?', id);
  }

  async findAll() {
    const db = await getDatabase();
    return db.getAllAsync<Product>('SELECT * FROM products ORDER BY createdAt DESC');
  }

  async findById(id: string) {
    const db = await getDatabase();
    return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = ?', id);
  }

  async findByFamily(familyId: string) {
    const db = await getDatabase();
    return db.getAllAsync<Product>(
      'SELECT * FROM products WHERE familyId = ? ORDER BY createdAt DESC',
      familyId,
    );
  }
}
