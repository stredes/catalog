import { File } from 'expo-file-system';
import { getDatabase, withDbTransaction } from '../../../../shared/infrastructure/sqlite';
import { Product } from '../../domain/entities/product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';

export class SQLiteProductRepository implements ProductRepository {
  async create(product: Product) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO products
       (id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      product.id,
      product.name,
      product.code ?? null,
      product.price,
      product.stock,
      product.format,
      product.photoUri ?? null,
      product.familyId,
      product.supplierId ?? null,
      product.createdAt,
      product.updatedAt,
    );
  }

  async update(product: Product) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE products
       SET name = ?, code = ?, price = ?, stock = ?, format = ?, photoUri = ?, familyId = ?, supplierId = ?, updatedAt = ?
       WHERE id = ?`,
      product.name,
      product.code ?? null,
      product.price,
      product.stock,
      product.format,
      product.photoUri ?? null,
      product.familyId,
      product.supplierId ?? null,
      product.updatedAt,
      product.id,
    );
  }

  async updateStock(id: string, stock: number) {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?',
      stock,
      new Date().toISOString(),
      id,
    );
  }

  async delete(id: string) {
    const db = await getDatabase();
    const current = await this.findById(id);

    await db.runAsync('DELETE FROM products WHERE id = ?', id);

    if (!current?.photoUri) {
      return;
    }

    const remaining = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM products WHERE photoUri = ?',
      current.photoUri,
    );

    if ((remaining?.total ?? 0) > 0) {
      return;
    }

    try {
      const imageFile = new File(current.photoUri);

      if (imageFile.exists) {
        imageFile.delete();
      }
    } catch {
      // Deleting history must not fail just because the physical image was moved.
    }
  }

  async findAll() {
    const db = await getDatabase();
    return db.getAllAsync<Product>(
      'SELECT id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt FROM products ORDER BY createdAt DESC'
    );
  }

  async findById(id: string) {
    const db = await getDatabase();
    return db.getFirstAsync<Product>(
      'SELECT id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt FROM products WHERE id = ?',
      id,
    );
  }

  async findByFamily(familyId: string) {
    const db = await getDatabase();
    return db.getAllAsync<Product>(
      'SELECT id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt FROM products WHERE familyId = ? ORDER BY createdAt DESC',
      familyId,
    );
  }

  async findBySupplier(supplierId: string) {
    const db = await getDatabase();
    return db.getAllAsync<Product>(
      'SELECT id, name, code, price, stock, format, photoUri, familyId, supplierId, createdAt, updatedAt FROM products WHERE supplierId = ? ORDER BY createdAt DESC',
      supplierId,
    );
  }

  async batchUpdateStock(changes: Array<{ productId: string; quantity: number }>): Promise<void> {
    if (changes.length === 0) return;
    const db = await getDatabase();
    await withDbTransaction(async (txn) => {
      for (const change of changes) {
        await txn.runAsync(
          'UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?',
          change.quantity,
          new Date().toISOString(),
          change.productId,
        );
      }
    });
  }
}
