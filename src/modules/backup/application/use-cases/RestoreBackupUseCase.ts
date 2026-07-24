import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { Product } from '../../../products/domain/entities/product';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { SupplierRepository } from '../../../suppliers/domain/repositories/SupplierRepository';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { RestoreBackupInput, RestoreBackupSchema } from '../dtos/BackupDtos';
import { AppError } from '../../../../shared/errors/AppError';
import { BackupImageMap, BackupPayload } from '../../domain/entities/BackupSnapshot';
import { Profile } from '../../../profile/domain/entities/profile';
import { validateBackupPayload } from '../../../../shared/validation/schemas';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';
import { DATABASE_SCHEMA_VERSION } from '../../../../shared/infrastructure/schema-version';

export type RestoredImageMap = Record<string, string>;
export type ImageRestorer = (images: BackupImageMap | undefined) => Promise<RestoredImageMap>;
export type ImageCollector = (products: Product[], profile: Profile | null) => Promise<BackupImageMap>;

const noopImageRestorer: ImageRestorer = async () => ({});
const noopImageCollector: ImageCollector = async () => ({});

export type RestoreResult = {
  familiesRestored: number;
  productsRestored: number;
  catalogsRestored: number;
  ordersRestored: number;
  suppliersRestored: number;
  profileRestored: boolean;
  imagesRestored: number;
  warnings: string[];
};

export class RestoreBackupUseCase {
  private readonly restoreImages: ImageRestorer;
  private readonly collectImages: ImageCollector;

  constructor(
    private readonly backupRepo: BackupRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly orderRepo: OrderRepository,
    private readonly supplierRepo: SupplierRepository,
    restoreImages?: ImageRestorer,
    collectImages?: ImageCollector,
  ) {
    this.restoreImages = restoreImages ?? noopImageRestorer;
    this.collectImages = collectImages ?? noopImageCollector;
  }

  async execute(input: RestoreBackupInput): Promise<RestoreResult> {
    const validated = RestoreBackupSchema.parse(input);

    const snapshot = await this.backupRepo.findById(validated.backupId);
    if (!snapshot) {
      throw new AppError('DATABASE_ERROR', `Backup no encontrado: ${validated.backupId}`);
    }

    const payload = await this.backupRepo.loadPayload(validated.backupId);
    if (!payload) {
      throw new AppError('DATABASE_ERROR', 'No se pudo cargar el contenido del backup');
    }

    this.validatePayloadIntegrity(payload);

    if (snapshot.checksum) {
      const currentChecksum = this.computeChecksum(payload);
      if (currentChecksum !== snapshot.checksum) {
        throw new AppError('DATABASE_ERROR', 'El checksum del backup no coincide con su contenido');
      }
    }

    const warnings: string[] = [];

    const [currentFamilies, currentProducts, currentCatalogs, currentProfile, currentOrders, currentSuppliers] = await Promise.all([
      this.familyRepo.findAll(),
      this.productRepo.findAll(),
      this.catalogRepo.findAll(),
      this.profileRepo.find(),
      this.orderRepo.findAll(),
      this.supplierRepo.findAll(),
    ]);

    const preventiveImages = await this.collectImages(currentProducts, currentProfile);
    const preventivePayload: BackupPayload = {
      schemaVersion: DATABASE_SCHEMA_VERSION,
      createdAt: nowIso(),
      families: currentFamilies,
      products: currentProducts,
      catalogs: currentCatalogs,
      profile: currentProfile,
      orders: currentOrders,
      suppliers: currentSuppliers,
      images: preventiveImages,
    };

    await this.backupRepo.saveSnapshot(
      {
        id: createId('bkp'),
        label: 'Backup preventivo antes de restauración',
        trigger: 'auto-before-delete',
        familiesCount: currentFamilies.length,
        productsCount: currentProducts.length,
        catalogsCount: currentCatalogs.length,
        ordersCount: currentOrders.length,
        suppliersCount: currentSuppliers.length,
        hasProfile: currentProfile !== null,
        checksum: this.computeChecksum(preventivePayload),
        filePath: '',
        createdAt: nowIso(),
      },
      preventivePayload,
    );

    const { valid: validSuppliers, failures: supplierFailures } = this.validateSuppliers(payload.suppliers ?? []);
    if (supplierFailures.length > 0) {
      warnings.push(`${supplierFailures.length} proveedores inválidos omitidos: ${supplierFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    const { valid: validOrders, failures: orderFailures } = this.validateOrders(payload.orders);
    if (orderFailures.length > 0) {
      warnings.push(`${orderFailures.length} pedidos inválidos omitidos: ${orderFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    let restoredImages: RestoredImageMap = {};
    try {
      restoredImages = await this.restoreImages(payload.images);
      const productsWithRestoredImages = payload.products.map((product) => ({
        ...product,
        photoUri: product.photoUri ? (restoredImages[product.photoUri] ?? product.photoUri) : undefined,
      }));
      const profileWithRestoredImage = payload.profile
        ? {
            ...payload.profile,
            logoUri: payload.profile.logoUri
              ? (restoredImages[payload.profile.logoUri] ?? payload.profile.logoUri)
              : undefined,
          }
        : null;

      await this.backupRepo.transactionalRestore({
        families: payload.families,
        products: productsWithRestoredImages,
        catalogs: payload.catalogs,
        profile: profileWithRestoredImage,
        orders: validOrders,
        suppliers: validSuppliers,
      });
    } catch (error) {
      throw new AppError(
        'DATABASE_ERROR',
        `La restauración falló y se revirtió automáticamente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        error instanceof Error ? error : undefined,
      );
    }

    return {
      familiesRestored: payload.families.length,
      productsRestored: payload.products.length,
      catalogsRestored: payload.catalogs.length,
      ordersRestored: validOrders.length,
      suppliersRestored: validSuppliers.length,
      profileRestored: payload.profile !== null,
      imagesRestored: Object.keys(restoredImages).length,
      warnings,
    };
  }

  private validatePayloadIntegrity(payload: BackupPayload): void {
    if (!Number.isFinite(payload.schemaVersion) || payload.schemaVersion < 0) {
      throw new AppError('DATABASE_ERROR', 'Backup tiene versión de esquema inválida');
    }
    if (!payload.createdAt) {
      throw new AppError('DATABASE_ERROR', 'Backup no tiene fecha de creación');
    }
  }

  private computeChecksum(payload: BackupPayload): string {
    const raw = JSON.stringify({
      fc: payload.families.length,
      pc: payload.products.length,
      cc: payload.catalogs.length,
      oc: payload.orders.length,
      sc: payload.suppliers?.length ?? 0,
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

  private validateSuppliers(suppliers: BackupPayload['suppliers']) {
    const rawSuppliers = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      contactName: s.contactName,
      notes: s.notes,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    const valid: BackupPayload['suppliers'] = [];
    const failures: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < rawSuppliers.length; i++) {
      const s = rawSuppliers[i];
      const errors: string[] = [];
      if (!s.id || typeof s.id !== 'string') errors.push('id inválido');
      if (!s.name || typeof s.name !== 'string') errors.push('name inválido');
      if (!s.createdAt) errors.push('createdAt inválido');
      if (!s.updatedAt) errors.push('updatedAt inválido');

      if (errors.length > 0) {
        failures.push({ index: i, errors });
      } else {
        valid.push(s as BackupPayload['suppliers'][number]);
      }
    }

    return { valid, failures };
  }

  private validateOrders(orders: BackupPayload['orders']) {
    const valid: BackupPayload['orders'] = [];
    const failures: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const errors: string[] = [];
      if (!o.id || typeof o.id !== 'string') errors.push('id inválido');
      if (!o.clientName || typeof o.clientName !== 'string') errors.push('clientName inválido');
      if (!Array.isArray(o.items)) errors.push('items no es un array');
      if (typeof o.subtotal !== 'number' || !Number.isFinite(o.subtotal)) errors.push('subtotal inválido');
      if (typeof o.total !== 'number' || !Number.isFinite(o.total)) errors.push('total inválido');
      if (!o.createdAt) errors.push('createdAt inválido');

      if (errors.length > 0) {
        failures.push({ index: i, errors });
      } else {
        valid.push(o);
      }
    }

    return { valid, failures };
  }
}
