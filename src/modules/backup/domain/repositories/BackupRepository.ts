import { BackupSnapshot, BackupPayload } from '../entities/BackupSnapshot';

export interface TransactionalRestoreData {
  families: BackupPayload['families'];
  products: BackupPayload['products'];
  catalogs: BackupPayload['catalogs'];
  profile: BackupPayload['profile'];
  orders: BackupPayload['orders'];
  suppliers: BackupPayload['suppliers'];
  quotations: BackupPayload['quotations'];
  clients?: BackupPayload['clients'];
  invoices?: BackupPayload['invoices'];
  purchaseDocuments: BackupPayload['purchaseDocuments'];
}

export interface BackupRepository {
  saveSnapshot(snapshot: BackupSnapshot, payload: BackupPayload): Promise<void>;
  findAll(): Promise<BackupSnapshot[]>;
  findById(id: string): Promise<BackupSnapshot | null>;
  loadPayload(id: string): Promise<BackupPayload | null>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
  transactionalRestore(data: TransactionalRestoreData): Promise<void>;
}
