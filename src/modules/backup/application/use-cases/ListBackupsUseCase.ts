import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { BackupSnapshot } from '../../domain/entities/BackupSnapshot';
import { ListBackupsInput, ListBackupsSchema } from '../dtos/BackupDtos';

export class ListBackupsUseCase {
  constructor(private readonly backupRepo: BackupRepository) {}

  async execute(input: ListBackupsInput = { limit: 20, offset: 0 }): Promise<{
    backups: BackupSnapshot[];
    total: number;
  }> {
    const { limit, offset } = ListBackupsSchema.parse(input);
    const all = await this.backupRepo.findAll();
    const total = all.length;
    const backups = all.slice(offset, offset + limit);

    return { backups, total };
  }
}
