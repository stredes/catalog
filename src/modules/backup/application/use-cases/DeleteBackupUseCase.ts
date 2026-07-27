import { BackupRepository } from '../../domain/repositories/BackupRepository';

export class DeleteBackupUseCase {
  constructor(private readonly backupRepo: BackupRepository) {}

  async execute(backupId: string): Promise<void> {
    await this.backupRepo.delete(backupId);
  }
}
