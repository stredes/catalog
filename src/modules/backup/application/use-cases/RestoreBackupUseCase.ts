import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { SupplierRepository } from '../../../suppliers/domain/repositories/SupplierRepository';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { RestoreBackupInput, RestoreBackupSchema } from '../dtos/BackupDtos';
import { AppError } from '../../../../shared/errors/AppError';
import { BackupImageMap } from '../../domain/entities/BackupSnapshot';

export type ImageRestorer = (images: BackupImageMap | undefined) => Promise<number>;

const noopImageRestorer: ImageRestorer = async () => 0;

export class RestoreBackupUseCase {
  private readonly restoreImages: ImageRestorer;

  constructor(
    private readonly backupRepo: BackupRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly orderRepo: OrderRepository,
    private readonly supplierRepo: SupplierRepository,
    restoreImages?: ImageRestorer,
  ) {
    this.restoreImages = restoreImages ?? noopImageRestorer;
  }

  async execute(input: RestoreBackupInput): Promise<{
    familiesRestored: number;
    productsRestored: number;
    catalogsRestored: number;
    ordersRestored: number;
    suppliersRestored: number;
    profileRestored: boolean;
    imagesRestored: number;
  }> {
    const validated = RestoreBackupSchema.parse(input);

    const snapshot = await this.backupRepo.findById(validated.backupId);
    if (!snapshot) {
      throw new AppError('DATABASE_ERROR', `Backup no encontrado: ${validated.backupId}`);
    }

    const payload = await this.backupRepo.loadPayload(validated.backupId);
    if (!payload) {
      throw new AppError('DATABASE_ERROR', 'No se pudo cargar el contenido del backup');
    }

    await this.clearAllData();

    await this.restoreSuppliers((payload as any).suppliers ?? []);
    await this.restoreFamilies(payload.families);
    await this.restoreProducts(payload.products);
    await this.restoreCatalogs(payload.catalogs);

    if (payload.profile) {
      await this.profileRepo.save(payload.profile);
    }

    const ordersRestored = await this.restoreOrders((payload as any).orders ?? []);
    const imagesRestored = await this.restoreImages(payload.images);

    return {
      familiesRestored: payload.families.length,
      productsRestored: payload.products.length,
      catalogsRestored: payload.catalogs.length,
      ordersRestored,
      suppliersRestored: (payload as any).suppliers?.length ?? 0,
      profileRestored: payload.profile !== null,
      imagesRestored,
    };
  }

  private async clearAllData(): Promise<void> {
    const [existingProducts, existingFamilies, existingCatalogs, existingOrders, existingSuppliers] = await Promise.all([
      this.productRepo.findAll(),
      this.familyRepo.findAll(),
      this.catalogRepo.findAll(),
      this.orderRepo.findAll(),
      this.supplierRepo.findAll(),
    ]);

    for (const product of existingProducts) {
      await this.productRepo.delete(product.id);
    }
    for (const catalog of existingCatalogs) {
      await this.catalogRepo.delete(catalog.id);
    }
    for (const family of existingFamilies) {
      await this.familyRepo.delete(family.id);
    }
    for (const order of existingOrders) {
      await this.orderRepo.delete(order.id);
    }
    for (const supplier of existingSuppliers) {
      await this.supplierRepo.delete(supplier.id);
    }
  }

  private async restoreSuppliers(suppliers: any[]): Promise<void> {
    for (const supplier of suppliers) {
      try {
        await this.supplierRepo.create({
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,
          contactName: supplier.contactName,
          notes: supplier.notes,
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt,
        });
      } catch {
        // Skip invalid suppliers
      }
    }
  }

  private async restoreFamilies(families: { id: string; name: string; createdAt: string; updatedAt: string }[]): Promise<void> {
    for (const family of families) {
      await this.familyRepo.create(family);
    }
  }

  private async restoreProducts(products: {
    id: string; name: string; code?: string; price: number; stock: number;
    format: string; photoUri?: string; familyId: string; supplierId?: string; createdAt: string; updatedAt: string;
  }[]): Promise<void> {
    for (const product of products) {
      await this.productRepo.create(product as any);
    }
  }

  private async restoreCatalogs(catalogs: {
    id: string; name: string; familyId: string; familyIds?: string[];
    format: string; productIds: string[]; pdfUri: string; createdAt: string;
  }[]): Promise<void> {
    for (const catalog of catalogs) {
      await this.catalogRepo.create(catalog as any);
    }
  }

  private async restoreOrders(orders: any[]): Promise<number> {
    let count = 0;
    for (const order of orders) {
      try {
        await this.orderRepo.save({
          id: order.id,
          orderNumber: order.orderNumber ?? 0,
          clientName: order.clientName,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
          subtotal: order.subtotal,
          iva: order.iva,
          total: order.total,
          status: order.status ?? 'pending',
          paidAmount: order.paidAmount ?? (order.status === 'paid' ? order.total : 0),
          notes: order.notes,
          createdAt: order.createdAt,
        });
        count++;
      } catch {
        // Skip invalid orders
      }
    }
    return count;
  }
}
