import { BackupSnapshot, BackupPayload } from '../entities/BackupSnapshot';

export interface BackupRepository {
  saveSnapshot(snapshot: BackupSnapshot, payload: BackupPayload): Promise<void>;
  findAll(): Promise<BackupSnapshot[]>;
  findById(id: string): Promise<BackupSnapshot | null>;
  loadPayload(id: string): Promise<BackupPayload | null>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
}
