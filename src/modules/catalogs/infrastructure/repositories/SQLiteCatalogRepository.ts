import { File } from 'expo-file-system';
import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Catalog, CatalogFormat } from '../../domain/entities/Catalog';
import { CatalogRepository } from '../../domain/repositories/CatalogRepository';

type CatalogRow = Omit<Catalog, 'productIds' | 'familyIds' | 'format'> & {
  format: CatalogFormat;
  productIds: string;
  familyIds?: string | null;
};

function toCatalog(row: CatalogRow): Catalog {
  return {
    ...row,
    productIds: JSON.parse(row.productIds) as string[],
    familyIds: row.familyIds ? (JSON.parse(row.familyIds) as string[]) : undefined,
  };
}

export class SQLiteCatalogRepository implements CatalogRepository {
  async create(catalog: Catalog) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO catalogs
       (id, name, familyId, familyIds, format, productIds, pdfUri, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      catalog.id,
      catalog.name,
      catalog.familyId,
      catalog.familyIds ? JSON.stringify(catalog.familyIds) : null,
      catalog.format,
      JSON.stringify(catalog.productIds),
      catalog.pdfUri,
      catalog.createdAt,
    );
  }

  async update(catalog: Catalog) {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE catalogs
       SET name = ?, familyId = ?, familyIds = ?, format = ?, productIds = ?, pdfUri = ?
       WHERE id = ?`,
      catalog.name,
      catalog.familyId,
      catalog.familyIds ? JSON.stringify(catalog.familyIds) : null,
      catalog.format,
      JSON.stringify(catalog.productIds),
      catalog.pdfUri,
      catalog.id,
    );
  }

  async delete(id: string) {
    const db = await getDatabase();
    const current = await this.findById(id);

    await db.runAsync('DELETE FROM catalogs WHERE id = ?', id);

    if (!current?.pdfUri) {
      return;
    }

    const remaining = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM catalogs WHERE pdfUri = ?',
      current.pdfUri,
    );

    if ((remaining?.total ?? 0) > 0) {
      return;
    }

    try {
      const pdfFile = new File(current.pdfUri);

      if (pdfFile.exists) {
        pdfFile.delete();
      }
    } catch {
      // Deleting history must not fail just because the physical PDF was moved.
    }
  }

  async findAll() {
    const db = await getDatabase();
    const rows = await db.getAllAsync<CatalogRow>(
      'SELECT * FROM catalogs ORDER BY createdAt DESC',
    );
    return rows.map(toCatalog);
  }

  async findById(id: string) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<CatalogRow>(
      'SELECT * FROM catalogs WHERE id = ?',
      id,
    );
    return row ? toCatalog(row) : null;
  }
}
