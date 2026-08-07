import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { SupplierRepository } from '../../../suppliers/domain/repositories/SupplierRepository';
import { QuotationRepository } from '../../../quotations/domain/repositories/QuotationRepository';
import { ClientRepository } from '../../../clients/domain/repositories/ClientRepository';
import { InvoiceRepository } from '../../../invoices/domain/repositories/InvoiceRepository';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { BackupSnapshot, BackupPayload, BackupImageMap } from '../../domain/entities/BackupSnapshot';
import { CreateBackupInput, CreateBackupSchema } from '../dtos/BackupDtos';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';
import { computeChecksum } from '../../../../shared/utils/checksum';
import { DATABASE_SCHEMA_VERSION } from '../../../../shared/infrastructure/schema-version';
import { Product } from '../../../products/domain/entities/product';
import { Profile } from '../../../profile/domain/entities/profile';

export type ImageCollector = (products: Product[], profile: Profile | null) => Promise<BackupImageMap>;

const noopImageCollector: ImageCollector = async () => ({});

export class CreateBackupUseCase {
  private readonly collectImages: ImageCollector;

  constructor(
    private readonly backupRepo: BackupRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly orderRepo: OrderRepository,
    private readonly supplierRepo: SupplierRepository,
    private readonly quotationRepo: QuotationRepository,
    private readonly clientRepo: ClientRepository,
    private readonly invoiceRepo: InvoiceRepository,
    collectImages?: ImageCollector,
  ) {
    this.collectImages = collectImages ?? noopImageCollector;
  }

  async execute(input: CreateBackupInput): Promise<BackupSnapshot> {
    const validated = CreateBackupSchema.parse(input);

    const [families, products, catalogs, profile, orders, suppliers, quotations, clients, invoices] = await Promise.all([
      this.familyRepo.findAll(),
      this.productRepo.findAll(),
      this.catalogRepo.findAll(),
      this.profileRepo.find(),
      this.orderRepo.findAll(),
      this.supplierRepo.findAll(),
      this.quotationRepo.findAll(),
      this.clientRepo.findAll(),
      this.invoiceRepo.findAll(),
    ]);

    const images = await this.collectImages(products, profile);

    const payload: BackupPayload = {
      schemaVersion: DATABASE_SCHEMA_VERSION,
      createdAt: nowIso(),
      families,
      products,
      catalogs,
      profile,
      orders,
      suppliers,
      quotations,
      clients,
      invoices,
      images,
    };

    const checksum = computeChecksum({
      fc: payload.families.length,
      pc: payload.products.length,
      cc: payload.catalogs.length,
      oc: payload.orders.length,
      sc: payload.suppliers?.length ?? 0,
      clc: payload.clients?.length ?? 0,
      fp: payload.profile !== null,
      fn: payload.families.map((f) => f.id).sort(),
      pn: payload.products.map((p) => p.id).sort(),
      cn: payload.catalogs.map((c) => c.id).sort(),
      cln: payload.clients?.map((c) => c.id).sort(),
    });

    const snapshot: BackupSnapshot = {
      id: createId('bkp'),
      label: validated.label,
      trigger: validated.trigger,
      familiesCount: families.length,
      productsCount: products.length,
      catalogsCount: catalogs.length,
      ordersCount: orders.length,
      suppliersCount: suppliers.length,
      invoicesCount: invoices.length,
      hasProfile: profile !== null,
      checksum,
      filePath: '',
      createdAt: nowIso(),
    };

    await this.backupRepo.saveSnapshot(snapshot, payload);

    return snapshot;
  }
}
