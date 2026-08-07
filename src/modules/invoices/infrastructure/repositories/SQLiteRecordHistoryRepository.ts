import { getDatabase } from '../../../../shared/infrastructure/sqlite';
import { InvoiceHistoryEntry } from '../../domain/repositories/RecordHistoryRepository';
import { RecordHistoryRepository } from '../../domain/repositories/RecordHistoryRepository';

type HistoryRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  snapshot: string;
  previous_snapshot: string | null;
  created_at: string;
};

function parseSnapshot(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

export class SQLiteRecordHistoryRepository implements RecordHistoryRepository {
  async findByEntity(entityId: string): Promise<InvoiceHistoryEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<HistoryRow>(
      `SELECT id, entity_type, entity_id, action, snapshot, previous_snapshot, created_at
       FROM record_history
       WHERE entity_type = 'invoice' AND entity_id = ?
       ORDER BY created_at ASC`,
      entityId,
    );
    return rows.map((row) => ({
      id: row.id,
      entityId: row.entity_id,
      action: row.action as InvoiceHistoryEntry['action'],
      snapshot: parseSnapshot(row.snapshot) ?? {},
      previousSnapshot: parseSnapshot(row.previous_snapshot),
      createdAt: row.created_at,
    }));
  }
}
