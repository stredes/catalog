import { Product } from '../../domain/entities/product';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { getDatabase } from '../../../../shared/infrastructure/database';

export class SqliteProductRepository implements ProductRepository {
  private get db() {
    return getDatabase();
  }

  async create(product: Product): Promise<void> {
    try {
      this.db.runSync(
        'INSERT INTO products (id, name, price, format, photoUri, familyId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [product.id, product.name, product.price.value, product.format, product.photoUri, product.familyId, product.createdAt, product.updatedAt],
      );
    } catch (error) {
      throw new Error(`Error al crear producto: ${error}`);
    }
  }

  async update(product: Product): Promise<void> {
    try {
      this.db.runSync(
        'UPDATE products SET name = ?, price = ?, format = ?, photoUri = ?, familyId = ?, updatedAt = ? WHERE id = ?',
        [product.name, product.price.value, product.format, product.photoUri, product.familyId, product.updatedAt, product.id],
      );
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.db.runSync('DELETE FROM products WHERE id = ?', [id]);
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error}`);
    }
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const result = this.db.getFirstSync('SELECT * FROM products WHERE id = ?', [id]) as any;
      return result ? this.mapRow(result) : null;
    } catch (error) {
      throw new Error(`Error al buscar producto: ${error}`);
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      const rows = this.db.getAllSync('SELECT * FROM products ORDER BY createdAt DESC') as any[];
      return rows.map(this.mapRow);
    } catch (error) {
      throw new Error(`Error al listar productos: ${error}`);
    }
  }

  async findByFamilyId(familyId: string): Promise<Product[]> {
    try {
      const rows = this.db.getAllSync('SELECT * FROM products WHERE familyId = ? ORDER BY createdAt DESC', [familyId]) as any[];
      return rows.map(this.mapRow);
    } catch (error) {
      throw new Error(`Error al buscar productos por familia: ${error}`);
    }
  }

  private mapRow(row: any): Product {
    return new Product(
      row.id,
      row.name,
      row.price,
      row.format,
      row.photoUri,
      row.familyId,
      row.createdAt,
      row.updatedAt,
    );
  }
}
