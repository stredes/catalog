import { CreateBackupUseCase } from '../../application/use-cases/CreateBackupUseCase';
import { ChangeDetector } from './ChangeDetector';
import { ChangeSnapshot } from '../../domain/repositories/ChangeTrackerPort';

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

  constructor(
    private readonly createBackup: CreateBackupUseCase,
    private readonly changeDetector: ChangeDetector,
    config: Partial<AutoBackupConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async onSessionStart(): Promise<void> {
    if (!this.config.enabled) return;

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
    if (!this.config.enabled) return;

    await this.createBackup.execute({
      label: `Pre-eliminación: ${entityType}`,
      trigger: 'auto-before-delete',
    });
  }

  async createManualBackup(label: string): Promise<void> {
    await this.createBackup.execute({
      label,
      trigger: 'manual',
    });
  }

  private async checkAndBackup(): Promise<void> {
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
    }
  }

  private async getLastBackupState(): Promise<ChangeSnapshot | null> {
    const snapshot = await this.createBackup['backupRepo'].findAll();
    if (snapshot.length === 0) return null;

    return {
      counts: {
        families: snapshot[0].familiesCount,
        products: snapshot[0].productsCount,
        catalogs: snapshot[0].catalogsCount,
        hasProfile: snapshot[0].hasProfile,
      },
      checksum: snapshot[0].checksum,
      timestamp: snapshot[0].createdAt,
    };
  }
}
