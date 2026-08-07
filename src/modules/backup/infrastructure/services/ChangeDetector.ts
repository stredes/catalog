import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { SupplierRepository } from '../../../suppliers/domain/repositories/SupplierRepository';
import { InvoiceRepository } from '../../../invoices/domain/repositories/InvoiceRepository';
import { QuotationRepository } from '../../../quotations/domain/repositories/QuotationRepository';
import { ClientRepository } from '../../../clients/domain/repositories/ClientRepository';
import { PurchaseDocumentRepository } from '../../../purchase-documents/domain/repositories/PurchaseDocumentRepository';
import { ChangeTrackerPort, ChangeSnapshot, TableCounts } from '../../domain/repositories/ChangeTrackerPort';
import { computeChecksum } from '../../../../shared/utils/checksum';

export class ChangeDetector implements ChangeTrackerPort {
  constructor(
    private readonly familyRepo: FamilyRepository,
    private readonly productRepo: ProductRepository,
    private readonly catalogRepo: CatalogRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly orderRepo: OrderRepository,
    private readonly supplierRepo: SupplierRepository,
    private readonly invoiceRepo: InvoiceRepository,
    private readonly quotationRepo: QuotationRepository,
    private readonly clientRepo: ClientRepository,
    private readonly purchaseDocumentRepo: PurchaseDocumentRepository,
  ) {}

  async capture(): Promise<ChangeSnapshot> {
    const [families, products, catalogs, profile, orders, suppliers, invoices, quotations, clients, purchaseDocuments] = await Promise.all([
      this.familyRepo.findAll(),
      this.productRepo.findAll(),
      this.catalogRepo.findAll(),
      this.profileRepo.find(),
      this.orderRepo.findAll(),
      this.supplierRepo.findAll(),
      this.invoiceRepo.findAll(),
      this.quotationRepo.findAll(),
      this.clientRepo.findAll(),
      this.purchaseDocumentRepo.findAll(),
    ]);

    const counts: TableCounts = {
      families: families.length,
      products: products.length,
      catalogs: catalogs.length,
      orders: orders.length,
      suppliers: suppliers.length,
      invoices: invoices.length,
      quotations: quotations.length,
      clients: clients.length,
      purchaseDocuments: purchaseDocuments.length,
      hasProfile: profile !== null,
    };

    return {
      counts,
      checksum: computeChecksum(counts),
      timestamp: new Date().toISOString(),
    };
  }

  async hasChanged(previous: ChangeSnapshot): Promise<boolean> {
    const current = await this.capture();
    return current.checksum !== previous.checksum;
  }

  async hasMassiveDeletion(previous: ChangeSnapshot, threshold = 0.5): Promise<boolean> {
    const current = await this.capture();

    const familyLoss = previous.counts.families > 0
      ? (previous.counts.families - current.counts.families) / previous.counts.families
      : 0;

    const productLoss = previous.counts.products > 0
      ? (previous.counts.products - current.counts.products) / previous.counts.products
      : 0;

    const orderLoss = previous.counts.orders > 0
      ? (previous.counts.orders - current.counts.orders) / previous.counts.orders
      : 0;

    return familyLoss >= threshold || productLoss >= threshold || orderLoss >= threshold;
  }
}
