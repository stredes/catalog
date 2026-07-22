import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { RestoreBackupInput, RestoreBackupSchema } from '../dtos/BackupDtos';
import { AppError } from '../../../../shared/errors/AppError';

export class RestoreBackupUseCase {
  constructor(
    private readonly backupRepo: BackupRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(input: RestoreBackupInput): Promise<{
    familiesRestored: number;
    productsRestored: number;
    catalogsRestored: number;
    ordersRestored: number;
    profileRestored: boolean;
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

    await this.restoreFamilies(payload.families);
    await this.restoreProducts(payload.products);
    await this.restoreCatalogs(payload.catalogs);

    if (payload.profile) {
      await this.profileRepo.save(payload.profile);
    }

    const ordersRestored = await this.restoreOrders((payload as any).orders ?? []);

    return {
      familiesRestored: payload.families.length,
      productsRestored: payload.products.length,
      catalogsRestored: payload.catalogs.length,
      ordersRestored,
      profileRestored: payload.profile !== null,
    };
  }

  private async clearAllData(): Promise<void> {
    const [existingProducts, existingFamilies, existingCatalogs, existingOrders] = await Promise.all([
      this.productRepo.findAll(),
      this.familyRepo.findAll(),
      this.catalogRepo.findAll(),
      this.orderRepo.findAll(),
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
  }

  private async restoreFamilies(families: { id: string; name: string; createdAt: string; updatedAt: string }[]): Promise<void> {
    for (const family of families) {
      await this.familyRepo.create(family);
    }
  }

  private async restoreProducts(products: {
    id: string; name: string; code?: string; price: number; stock: number;
    format: string; photoUri?: string; familyId: string; createdAt: string; updatedAt: string;
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
