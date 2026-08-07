import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { Product } from '../../../products/domain/entities/product';
import { CatalogRepository } from '../../../catalogs/domain/repositories/CatalogRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import { SupplierRepository } from '../../../suppliers/domain/repositories/SupplierRepository';
import { QuotationRepository } from '../../../quotations/domain/repositories/QuotationRepository';
import { InvoiceRepository } from '../../../invoices/domain/repositories/InvoiceRepository';
import { ClientRepository } from '../../../clients/domain/repositories/ClientRepository';
import { PurchaseDocumentRepository } from '../../../purchase-documents/domain/repositories/PurchaseDocumentRepository';
import { BackupRepository } from '../../domain/repositories/BackupRepository';
import { RestoreBackupInput, RestoreBackupSchema } from '../dtos/BackupDtos';
import { AppError } from '../../../../shared/errors/AppError';
import { BackupImageMap, BackupPayload } from '../../domain/entities/BackupSnapshot';
import { Profile } from '../../../profile/domain/entities/profile';
import { validateBackupPayload } from '../../../../shared/validation/schemas';
import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';
import { computeChecksum } from '../../../../shared/utils/checksum';
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
  quotationsRestored: number;
  clientsRestored: number;
  invoicesRestored: number;
  purchaseDocumentsRestored: number;
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
    private readonly quotationRepo: QuotationRepository,
    private readonly invoiceRepo: InvoiceRepository,
    private readonly clientRepo: ClientRepository,
    private readonly purchaseDocumentRepo: PurchaseDocumentRepository,
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
      const currentChecksum = computeChecksum({
        fc: payload.families.length,
        pc: payload.products.length,
        cc: payload.catalogs.length,
        oc: payload.orders.length,
        sc: payload.suppliers?.length ?? 0,
        qc: payload.quotations?.length ?? 0,
        ic: payload.invoices?.length ?? 0,
        clc: payload.clients?.length ?? 0,
        pdc: payload.purchaseDocuments?.length ?? 0,
        fp: payload.profile !== null,
        fn: payload.families.map((f) => f.id).sort(),
        pn: payload.products.map((p) => p.id).sort(),
        cn: payload.catalogs.map((c) => c.id).sort(),
        cln: payload.clients?.map((c) => c.id).sort(),
      });
      if (currentChecksum !== snapshot.checksum) {
        throw new AppError('DATABASE_ERROR', 'El checksum del backup no coincide con su contenido');
      }
    }

    const warnings: string[] = [];

    const [currentFamilies, currentProducts, currentCatalogs, currentProfile, currentOrders, currentSuppliers, currentQuotations, currentInvoices, currentClients, currentPurchaseDocuments] = await Promise.all([
      this.familyRepo.findAll(),
      this.productRepo.findAll(),
      this.catalogRepo.findAll(),
      this.profileRepo.find(),
      this.orderRepo.findAll(),
      this.supplierRepo.findAll(),
      this.quotationRepo.findAll(),
      this.invoiceRepo.findAll(),
      this.clientRepo.findAll(),
      this.purchaseDocumentRepo.findAll(),
    ]);

    if (validated.createPreventiveBackup) {
      const preventivePayload: BackupPayload = {
        schemaVersion: DATABASE_SCHEMA_VERSION,
        createdAt: nowIso(),
        families: currentFamilies,
        products: currentProducts,
        catalogs: currentCatalogs,
        profile: currentProfile,
        orders: currentOrders,
        suppliers: currentSuppliers,
        quotations: currentQuotations,
        invoices: currentInvoices,
        clients: currentClients,
        purchaseDocuments: currentPurchaseDocuments,
        images: {},
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
          invoicesCount: currentInvoices.length,
          quotationsCount: currentQuotations.length,
          clientsCount: currentClients.length,
          purchaseDocumentsCount: currentPurchaseDocuments.length,
          hasProfile: currentProfile !== null,
          checksum: computeChecksum({
            fc: currentFamilies.length,
            pc: currentProducts.length,
            cc: currentCatalogs.length,
            oc: currentOrders.length,
            sc: currentSuppliers.length,
            qc: currentQuotations.length,
            ic: currentInvoices.length,
            clc: currentClients.length,
            pdc: currentPurchaseDocuments.length,
            fp: currentProfile !== null,
            fn: currentFamilies.map((f) => f.id).sort(),
            pn: currentProducts.map((p) => p.id).sort(),
            cn: currentCatalogs.map((c) => c.id).sort(),
            cln: currentClients.map((c) => c.id).sort(),
          }),
          filePath: '',
          createdAt: nowIso(),
        },
        preventivePayload,
      );
    }

    const { valid: validSuppliers, failures: supplierFailures } = this.validateSuppliers(payload.suppliers ?? []);
    if (supplierFailures.length > 0) {
      warnings.push(`${supplierFailures.length} proveedores inválidos omitidos: ${supplierFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    const { valid: validOrders, failures: orderFailures } = this.validateOrders(payload.orders);
    if (orderFailures.length > 0) {
      warnings.push(`${orderFailures.length} pedidos inválidos omitidos: ${orderFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    const { valid: validQuotations, failures: quotationFailures } = this.validateQuotations(payload.quotations ?? []);
    if (quotationFailures.length > 0) {
      warnings.push(`${quotationFailures.length} cotizaciones inválidas omitidas: ${quotationFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    const { valid: validInvoices, failures: invoiceFailures } = this.validateInvoices(payload.invoices ?? []);
    if (invoiceFailures.length > 0) {
      warnings.push(`${invoiceFailures.length} facturas inválidas omitidas: ${invoiceFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    const { valid: validClients, failures: clientFailures } = this.validateClients(payload.clients ?? []);
    if (clientFailures.length > 0) {
      warnings.push(`${clientFailures.length} clientes inválidos omitidos: ${clientFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
    }

    const { valid: validPurchaseDocuments, failures: purchaseDocumentFailures } = this.validatePurchaseDocuments(payload.purchaseDocuments ?? []);
    if (purchaseDocumentFailures.length > 0) {
      warnings.push(`${purchaseDocumentFailures.length} documentos de compra inválidos omitidos: ${purchaseDocumentFailures.map((f) => `índice ${f.index}: ${f.errors[0]}`).join('; ')}`);
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
        quotations: validQuotations,
        clients: validClients,
        invoices: validInvoices,
        purchaseDocuments: validPurchaseDocuments,
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
      quotationsRestored: validQuotations.length,
      clientsRestored: validClients.length,
      invoicesRestored: validInvoices.length,
      purchaseDocumentsRestored: validPurchaseDocuments.length,
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

  private validateSuppliers(suppliers: BackupPayload['suppliers']) {
    const rawSuppliers = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      rut: s.rut,
      address: s.address,
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

  private validateQuotations(quotations: BackupPayload['quotations']) {
    const valid: BackupPayload['quotations'] = [];
    const failures: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < quotations.length; i++) {
      const q = quotations[i];
      const errors: string[] = [];
      if (!q.id || typeof q.id !== 'string') errors.push('id inválido');
      if (typeof q.quotationNumber !== 'number') errors.push('quotationNumber inválido');
      if (!q.clientName || typeof q.clientName !== 'string') errors.push('clientName inválido');
      if (!Array.isArray(q.items)) errors.push('items no es un array');
      if (typeof q.subtotal !== 'number' || !Number.isFinite(q.subtotal)) errors.push('subtotal inválido');
      if (typeof q.total !== 'number' || !Number.isFinite(q.total)) errors.push('total inválido');
      if (!q.createdAt) errors.push('createdAt inválido');

      if (errors.length > 0) {
        failures.push({ index: i, errors });
      } else {
        valid.push(q);
      }
    }

    return { valid, failures };
  }

  private validateInvoices(invoices: NonNullable<BackupPayload['invoices']>) {
    const valid: NonNullable<BackupPayload['invoices']> = [];
    const failures: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];
      const errors: string[] = [];
      if (!inv.id || typeof inv.id !== 'string') errors.push('id inválido');
      if (!inv.invoiceNumber || typeof inv.invoiceNumber !== 'string') errors.push('invoiceNumber inválido');
      if (!inv.invoiceDate || typeof inv.invoiceDate !== 'string') errors.push('invoiceDate inválido');
      if (!inv.clientName || typeof inv.clientName !== 'string') errors.push('clientName inválido');
      if (typeof inv.netAmount !== 'number' || !Number.isFinite(inv.netAmount)) errors.push('netAmount inválido');
      if (typeof inv.totalAmount !== 'number' || !Number.isFinite(inv.totalAmount)) errors.push('totalAmount inválido');
      if (!inv.createdAt) errors.push('createdAt inválido');

      if (errors.length > 0) {
        failures.push({ index: i, errors });
      } else {
        valid.push(inv);
      }
    }

    return { valid, failures };
  }

  private validateClients(clients: NonNullable<BackupPayload['clients']>) {
    const valid: BackupPayload['clients'] = [];
    const failures: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      const errors: string[] = [];
      if (!c.id || typeof c.id !== 'string') errors.push('id inválido');
      if (!c.name || typeof c.name !== 'string') errors.push('name inválido');
      if (!c.createdAt) errors.push('createdAt inválido');
      if (!c.updatedAt) errors.push('updatedAt inválido');

      if (errors.length > 0) {
        failures.push({ index: i, errors });
      } else {
        valid.push(c);
      }
    }

    return { valid, failures };
  }

  private validatePurchaseDocuments(documents: BackupPayload['purchaseDocuments']) {
    const valid: BackupPayload['purchaseDocuments'] = [];
    const failures: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < documents.length; i++) {
      const d = documents[i];
      const errors: string[] = [];
      if (!d.id || typeof d.id !== 'string') errors.push('id inválido');
      if (typeof d.documentNumber !== 'number') errors.push('documentNumber inválido');
      if (d.type !== 'quotation' && d.type !== 'purchase-order') errors.push('type inválido');
      if (!d.supplierId || typeof d.supplierId !== 'string') errors.push('supplierId inválido');
      if (!d.supplierName || typeof d.supplierName !== 'string') errors.push('supplierName inválido');
      if (!Array.isArray(d.items)) errors.push('items no es un array');
      if (typeof d.total !== 'number' || !Number.isFinite(d.total)) errors.push('total inválido');
      if (!d.createdAt) errors.push('createdAt inválido');

      if (errors.length > 0) {
        failures.push({ index: i, errors });
      } else {
        valid.push(d);
      }
    }

    return { valid, failures };
  }
}
