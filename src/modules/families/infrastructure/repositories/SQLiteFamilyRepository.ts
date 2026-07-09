import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Family } from '../../domain/entities/Family';
import { FamilyRepository } from '../../domain/repositories/FamilyRepository';

export class SQLiteFamilyRepository implements FamilyRepository {
  async create(family: Family) {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO families (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      family.id,
      family.name,
      family.createdAt,
      family.updatedAt,
    );
  }

  async update(family: Family) {
    const db = await getDatabase();
    await db.runAsync(
      'UPDATE families SET name = ?, updatedAt = ? WHERE id = ?',
      family.name,
      family.updatedAt,
      family.id,
    );
  }

  async delete(id: string) {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM families WHERE id = ?', id);
  }

  async findAll() {
    const db = await getDatabase();
    return db.getAllAsync<Family>('SELECT * FROM families ORDER BY createdAt DESC');
  }

  async findById(id: string) {
    const db = await getDatabase();
    return db.getFirstAsync<Family>('SELECT * FROM families WHERE id = ?', id);
  }
}
