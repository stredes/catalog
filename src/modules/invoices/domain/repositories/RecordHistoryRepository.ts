export type RecordHistoryAction = 'created' | 'updated' | 'deleted' | 'imported';

export type InvoiceHistoryEntry = {
  id: string;
  entityId: string;
  action: RecordHistoryAction;
  snapshot: Record<string, unknown>;
  previousSnapshot?: Record<string, unknown> | null;
  createdAt: string;
};

export interface RecordHistoryRepository {
  findByEntity(entityId: string): Promise<InvoiceHistoryEntry[]>;
}
