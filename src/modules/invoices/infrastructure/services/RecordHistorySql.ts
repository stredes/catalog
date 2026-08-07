import { createId } from '../../../../shared/utils/ids';
import { RecordHistoryAction } from '../../domain/repositories/RecordHistoryRepository';

type SqlRunner = {
  runAsync: (sql: string, ...params: (string | number | null)[]) => Promise<{ changes?: number }>;
};

export const RECORD_HISTORY_DDL = `
  CREATE TABLE IF NOT EXISTS record_history (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('invoice')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'imported')),
    snapshot TEXT NOT NULL,
    previous_snapshot TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_record_history_entity
    ON record_history(entity_type, entity_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_record_history_created_at
    ON record_history(created_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_record_history_imported_once
    ON record_history(entity_type, entity_id, action)
    WHERE action = 'imported';
`;

export function serializeSnapshot(snapshot: object | null | undefined): string | null {
  if (!snapshot) return null;
  if (Object.keys(snapshot).length === 0) return null;
  return JSON.stringify(snapshot);
}

export type RecordHistoryInsertInput = {
  entityType: 'invoice';
  entityId: string;
  action: RecordHistoryAction;
  snapshot: object;
  previousSnapshot?: object | null;
  occurredAt?: string;
};

export async function insertRecordHistory(
  runner: SqlRunner,
  input: RecordHistoryInsertInput,
): Promise<void> {
  await runner.runAsync(
    `INSERT INTO record_history (id, entity_type, entity_id, action, snapshot, previous_snapshot, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    createId('hist'),
    input.entityType,
    input.entityId,
    input.action,
    serializeSnapshot(input.snapshot) ?? '{}',
    serializeSnapshot(input.previousSnapshot),
    input.occurredAt ?? new Date().toISOString(),
  );
}

export async function recordImportedOnce(
  runner: SqlRunner,
  entityId: string,
  snapshot: object,
  occurredAt: string,
): Promise<void> {
  await runner.runAsync(
    `INSERT OR IGNORE INTO record_history (id, entity_type, entity_id, action, snapshot, previous_snapshot, created_at)
     VALUES (?, 'invoice', ?, 'imported', ?, NULL, ?)`,
    createId('hist'),
    entityId,
    serializeSnapshot(snapshot) ?? '{}',
    occurredAt,
  );
}
