import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { Profile } from '../../domain/entities/Profile';
import { ProfileRepository } from '../../domain/repositories/ProfileRepository';

export class SQLiteProfileRepository implements ProfileRepository {
  async find() {
    const db = await getDatabase();
    return db.getFirstAsync<Profile>('SELECT * FROM profile WHERE id = ?', 'profile');
  }

  async save(profile: Profile) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO profile
       (id, businessName, ownerName, phone, email, address, website, logoUri, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         businessName = excluded.businessName,
         ownerName = excluded.ownerName,
         phone = excluded.phone,
         email = excluded.email,
         address = excluded.address,
         website = excluded.website,
         logoUri = excluded.logoUri,
         updatedAt = excluded.updatedAt`,
      profile.id,
      profile.businessName,
      profile.ownerName ?? null,
      profile.phone ?? null,
      profile.email ?? null,
      profile.address ?? null,
      profile.website ?? null,
      profile.logoUri ?? null,
      profile.updatedAt,
    );
  }
}
