import { Profile } from '../../domain/entities/profile';
import { ProfileRepository } from '../../domain/repositories/profile-repository';
import { getDatabase } from '../../../../shared/infrastructure/database';

export class SqliteProfileRepository implements ProfileRepository {
  private get db() {
    return getDatabase();
  }

  async save(profile: Profile): Promise<void> {
    try {
      const existing = this.db.getFirstSync('SELECT id FROM profiles WHERE id = ?', [profile.id]) as any;
      if (existing) {
        this.db.runSync(
          `UPDATE profiles SET name = ?, email = ?, phone = ?, company = ?, address = ?, photoUri = ?, rut = ?, updatedAt = ? WHERE id = ?`,
          [profile.name, profile.email, profile.phone, profile.company, profile.address, profile.photoUri, profile.rut, profile.updatedAt, profile.id],
        );
      } else {
        this.db.runSync(
          `INSERT INTO profiles (id, name, email, phone, company, address, photoUri, rut, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [profile.id, profile.name, profile.email, profile.phone, profile.company, profile.address, profile.photoUri, profile.rut, profile.createdAt, profile.updatedAt],
        );
      }
    } catch (error) {
      throw new Error(`Error al guardar perfil: ${error}`);
    }
  }

  async find(): Promise<Profile | null> {
    try {
      const row = this.db.getFirstSync('SELECT * FROM profiles LIMIT 1') as any;
      if (!row) return null;
      return this.mapRow(row);
    } catch (error) {
      throw new Error(`Error al obtener perfil: ${error}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      this.db.runSync('DELETE FROM profiles WHERE id = ?', [id]);
    } catch (error) {
      throw new Error(`Error al eliminar perfil: ${error}`);
    }
  }

  private mapRow(row: any): Profile {
    return new Profile(
      row.id,
      row.name,
      row.email,
      row.phone,
      row.company,
      row.address,
      row.photoUri,
      row.rut,
      row.createdAt,
      row.updatedAt,
    );
  }
}
