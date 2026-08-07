import { CreateBackupUseCase } from '../../application/use-cases/CreateBackupUseCase';
import { ChangeDetector } from './ChangeDetector';
import { ChangeSnapshot } from '../../domain/repositories/ChangeTrackerPort';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { computeChecksum } from '../../../../shared/utils/checksum';

export type AutoBackupConfig = {
  enabled: boolean;
  checkIntervalMs: number;
  maxSnapshots: number;
};

const DEFAULT_CONFIG: AutoBackupConfig = {
  enabled: true,
  checkIntervalMs: 5 * 60 * 1000,
  maxSnapshots: 10,
};

export class AutoBackupService {
  private config: AutoBackupConfig;
  private lastSnapshot: ChangeSnapshot | null = null;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  constructor(
    private readonly createBackup: CreateBackupUseCase,
    private readonly changeDetector: ChangeDetector,
    private readonly backupRepo: BackupRepository,
    config: Partial<AutoBackupConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async onSessionStart(): Promise<void> {
    if (!this.config.enabled || this.isRunning) return;
    this.isRunning = true;

    try {
      const current = await this.changeDetector.capture();
      const lastBackup = await this.getLastBackupState();

      if (!lastBackup) {
        await this.createBackup.execute({
          label: 'Inicio de sesión - primer backup',
          trigger: 'auto-periodic',
        });
        this.lastSnapshot = current;
        return;
      }

      const changed = await this.changeDetector.hasChanged(lastBackup);
      if (changed) {
        await this.createBackup.execute({
          label: 'Inicio de sesión - cambios detectados',
          trigger: 'auto-periodic',
        });
      }

      this.lastSnapshot = current;
    } finally {
      this.isRunning = false;
    }
  }

  startMonitoring(): void {
    if (!this.config.enabled || this.checkTimer) return;

    this.checkTimer = setInterval(async () => {
      await this.checkAndBackup();
    }, this.config.checkIntervalMs);
  }

  stopMonitoring(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  async createPreDeleteBackup(entityType: string): Promise<void> {
    if (!this.config.enabled || this.isRunning) return;

    this.isRunning = true;
    try {
      await this.createBackup.execute({
        label: `Pre-eliminación: ${entityType}`,
        trigger: 'auto-before-delete',
      });
    } finally {
      this.isRunning = false;
    }
  }

  async createManualBackup(label: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Ya hay una operación de backup en curso');
    }

    this.isRunning = true;
    try {
      await this.createBackup.execute({
        label,
        trigger: 'manual',
      });
    } finally {
      this.isRunning = false;
    }
  }

  get isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  private async checkAndBackup(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      if (!this.lastSnapshot) {
        this.lastSnapshot = await this.changeDetector.capture();
        return;
      }

      const changed = await this.changeDetector.hasChanged(this.lastSnapshot);
      if (changed) {
        const massive = await this.changeDetector.hasMassiveDeletion(this.lastSnapshot);

        await this.createBackup.execute({
          label: massive
            ? 'Borrado masivo detectado'
            : 'Cambio periódico detectado',
          trigger: 'auto-periodic',
        });

        this.lastSnapshot = await this.changeDetector.capture();
      }
    } catch (error) {
      console.error('[AutoBackupService] Error en chequeo periódico:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async getLastBackupState(): Promise<ChangeSnapshot | null> {
    const snapshots = await this.backupRepo.findAll();
    if (snapshots.length === 0) return null;

    const last = snapshots[0];
    const counts = {
      families: last.familiesCount,
      products: last.productsCount,
      catalogs: last.catalogsCount,
      orders: last.ordersCount,
      suppliers: last.suppliersCount ?? 0,
      invoices: last.invoicesCount ?? 0,
      quotations: last.quotationsCount ?? 0,
      clients: last.clientsCount ?? 0,
      purchaseDocuments: last.purchaseDocumentsCount ?? 0,
      hasProfile: last.hasProfile,
    };

    return {
      counts,
      checksum: computeChecksum(counts),
      timestamp: last.createdAt,
    };
  }
}
