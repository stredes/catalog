import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { BackupSnapshot, BackupPayload } from '../../domain/entities/BackupSnapshot';
import { BackupRepository } from '../../domain/repositories/BackupRepository';

type SnapshotRow = {
  id: string;
  label: string;
  trigger: string;
  familiesCount: number;
  productsCount: number;
  catalogsCount: number;
  ordersCount?: number;
  hasProfile: number;
  checksum: string;
  createdAt: string;
};

type PayloadRow = {
  snapshotId: string;
  payload: string;
};

const MAX_SNAPSHOTS = 10;

export class SQLiteBackupRepository implements BackupRepository {
  async saveSnapshot(snapshot: BackupSnapshot, payload: BackupPayload): Promise<void> {
    const db = await getDatabase();

    await db.withExclusiveTransactionAsync(async (transaction) => {
      try {
        await transaction.runAsync(
          `INSERT INTO backup_snapshots (id, label, trigger, familiesCount, productsCount, catalogsCount, ordersCount, hasProfile, checksum, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          snapshot.id,
          snapshot.label,
          snapshot.trigger,
          snapshot.familiesCount,
          snapshot.productsCount,
          snapshot.catalogsCount,
          snapshot.ordersCount ?? 0,
          snapshot.hasProfile ? 1 : 0,
          snapshot.checksum,
          snapshot.createdAt,
        );
      } catch {
        await transaction.runAsync(
          `INSERT INTO backup_snapshots (id, label, trigger, familiesCount, productsCount, catalogsCount, hasProfile, checksum, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          snapshot.id,
          snapshot.label,
          snapshot.trigger,
          snapshot.familiesCount,
          snapshot.productsCount,
          snapshot.catalogsCount,
          snapshot.hasProfile ? 1 : 0,
          snapshot.checksum,
          snapshot.createdAt,
        );
      }

      await transaction.runAsync(
        'INSERT INTO backup_payloads (snapshotId, payload) VALUES (?, ?)',
        snapshot.id,
        JSON.stringify(payload),
      );
    });

    await this.enforceMaxSnapshots();
  }

  async findAll(): Promise<BackupSnapshot[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SnapshotRow>(
      'SELECT * FROM backup_snapshots ORDER BY createdAt DESC'
    );
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<BackupSnapshot | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SnapshotRow>(
      'SELECT * FROM backup_snapshots WHERE id = ?',
      id
    );
    return row ? this.toDomain(row) : null;
  }

  async loadPayload(id: string): Promise<BackupPayload | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PayloadRow>(
      'SELECT payload FROM backup_payloads WHERE snapshotId = ?',
      id
    );
    if (!row) return null;
    return JSON.parse(row.payload) as BackupPayload;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync('DELETE FROM backup_payloads WHERE snapshotId = ?', id);
      await transaction.runAsync('DELETE FROM backup_snapshots WHERE id = ?', id);
    });
  }

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync('DELETE FROM backup_payloads');
      await transaction.runAsync('DELETE FROM backup_snapshots');
    });
  }

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM backup_snapshots'
    );
    return row?.total ?? 0;
  }

  private async enforceMaxSnapshots(): Promise<void> {
    const db = await getDatabase();
    const count = await this.count();

    if (count > MAX_SNAPSHOTS) {
      const excess = count - MAX_SNAPSHOTS;
      await db.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.runAsync(
          `DELETE FROM backup_payloads WHERE snapshotId IN (
            SELECT id FROM backup_snapshots ORDER BY createdAt ASC LIMIT ?
          )`,
          excess
        );
        await transaction.runAsync(
          `DELETE FROM backup_snapshots WHERE id IN (
            SELECT id FROM backup_snapshots ORDER BY createdAt ASC LIMIT ?
          )`,
          excess
        );
      });
    }
  }

  private toDomain(row: SnapshotRow): BackupSnapshot {
    return {
      id: row.id,
      label: row.label,
      trigger: row.trigger as BackupSnapshot['trigger'],
      familiesCount: row.familiesCount,
      productsCount: row.productsCount,
      catalogsCount: row.catalogsCount,
      ordersCount: row.ordersCount ?? 0,
      hasProfile: row.hasProfile === 1,
      checksum: row.checksum,
      filePath: '',
      createdAt: row.createdAt,
    };
  }
}
