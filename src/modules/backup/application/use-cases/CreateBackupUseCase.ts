import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { BackupSnapshot, BackupPayload } from '../../domain/entities/BackupSnapshot';
import { CreateBackupInput, CreateBackupSchema } from '../dtos/BackupDtos';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';
import { DATABASE_SCHEMA_VERSION } from '../../../../shared/infrastructure/sqlite';

export class CreateBackupUseCase {
  constructor(
    private readonly backupRepo: BackupRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: CreateBackupInput): Promise<BackupSnapshot> {
    const validated = CreateBackupSchema.parse(input);

    const [families, products, catalogs, profile, orders] = await Promise.all([
      this.familyRepo.findAll(),
      this.productRepo.findAll(),
      this.catalogRepo.findAll(),
      this.profileRepo.find(),
      this.orderRepo.findAll(),
    ]);

    const payload: BackupPayload = {
      schemaVersion: DATABASE_SCHEMA_VERSION,
      createdAt: nowIso(),
      families,
      products,
      catalogs,
      profile,
      orders,
    };

    const checksum = computeChecksum(payload);

    const snapshot: BackupSnapshot = {
      id: createId('bkp'),
      label: validated.label,
      trigger: validated.trigger,
      familiesCount: families.length,
      productsCount: products.length,
      catalogsCount: catalogs.length,
      ordersCount: orders.length,
      hasProfile: profile !== null,
      checksum,
      filePath: '',
      createdAt: nowIso(),
    };

    await this.backupRepo.saveSnapshot(snapshot, payload);

    return snapshot;
  }
}

function computeChecksum(payload: BackupPayload): string {
  const raw = JSON.stringify({
    fc: payload.families.length,
    pc: payload.products.length,
    cc: payload.catalogs.length,
    oc: payload.orders.length,
    fp: payload.profile !== null,
    fn: payload.families.map((f) => f.id).sort(),
    pn: payload.products.map((p) => p.id).sort(),
    cn: payload.catalogs.map((c) => c.id).sort(),
  });

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
