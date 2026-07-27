import { Catalog } from '../modules/catalogs/domain/entities/Catalog';
import { CatalogRepository } from '../modules/catalogs/domain/repositories/CatalogRepository';
import { Family } from '../modules/families/domain/entities/Family';
import { FamilyRepository } from '../modules/families/domain/repositories/FamilyRepository';
import { PdfCatalogInput, PdfGenerator } from '../modules/pdf/domain/PdfGenerator';
import { Product } from '../modules/products/domain/entities/product';
import { ImagePickerService, ImageSource } from '../modules/products/domain/repositories/ImagePickerService';
import { ProductRepository } from '../modules/products/domain/repositories/ProductRepository';
import { Profile } from '../modules/profile/domain/entities/profile';
import { ProfileRepository } from '../modules/profile/domain/repositories/ProfileRepository';
import { NativeShareService } from '../modules/sharing/domain/NativeShareService';
import { BackupSnapshot, BackupPayload } from '../modules/backup/domain/entities/BackupSnapshot';
import { BackupRepository, TransactionalRestoreData } from '../modules/backup/domain/repositories/BackupRepository';
import { Order } from '../modules/orders/domain/entities/Order';
import { OrderRepository } from '../modules/orders/domain/repositories/OrderRepository';
import { CartItem } from '../modules/orders/domain/entities/CartItem';
import { CartRepository } from '../modules/orders/domain/repositories/CartRepository';
import { PurchaseCartItem } from '../modules/orders/domain/entities/PurchaseCartItem';
import { PurchaseCartRepository } from '../modules/orders/domain/repositories/PurchaseCartRepository';
import { OrderPdfGeneratorPort } from '../modules/orders/application/use-cases/GenerateOrderPdfUseCase';
import { Supplier } from '../modules/suppliers/domain/entities/Supplier';
import { SupplierRepository } from '../modules/suppliers/domain/repositories/SupplierRepository';
import { Quotation } from '../modules/quotations/domain/entities/Quotation';
import { QuotationRepository } from '../modules/quotations/domain/repositories/QuotationRepository';
import { computeChecksum } from '../shared/utils/checksum';

export class InMemoryFamilyRepository implements FamilyRepository {
  families = new Map<string, Family>();

  async create(family: Family) {
    this.families.set(family.id, family);
  }

  async update(family: Family) {
    this.families.set(family.id, family);
  }

  async delete(id: string) {
    this.families.delete(id);
  }

  async findAll() {
    return [...this.families.values()];
  }

  async findById(id: string) {
    return this.families.get(id) ?? null;
  }
}

export class InMemoryProductRepository implements ProductRepository {
  products = new Map<string, Product>();

  async create(product: Product) {
    this.products.set(product.id, product);
  }

  async update(product: Product) {
    this.products.set(product.id, product);
  }

  async updateStock(id: string, stock: number) {
    const product = this.products.get(id);
    if (product) {
      this.products.set(id, { ...product, stock, updatedAt: new Date().toISOString() });
    }
  }

  async batchUpdateStock(changes: Array<{ productId: string; quantity: number }>) {
    for (const change of changes) {
      const product = this.products.get(change.productId);
      if (product) {
        this.products.set(change.productId, {
          ...product,
          stock: product.stock + change.quantity,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  async delete(id: string) {
    this.products.delete(id);
  }

  async findAll() {
    return [...this.products.values()];
  }

  async findById(id: string) {
    return this.products.get(id) ?? null;
  }

  async findByFamily(familyId: string) {
    return [...this.products.values()].filter(
      (product) => product.familyId === familyId,
    );
  }

  async findBySupplier(supplierId: string) {
    return [...this.products.values()].filter(
      (product) => product.supplierId === supplierId,
    );
  }
}

export class InMemoryCatalogRepository implements CatalogRepository {
  catalogs = new Map<string, Catalog>();

  async create(catalog: Catalog) {
    this.catalogs.set(catalog.id, catalog);
  }

  async update(catalog: Catalog) {
    this.catalogs.set(catalog.id, catalog);
  }

  async delete(id: string) {
    this.catalogs.delete(id);
  }

  async findAll() {
    return [...this.catalogs.values()];
  }

  async findById(id: string) {
    return this.catalogs.get(id) ?? null;
  }
}

export class InMemoryProfileRepository implements ProfileRepository {
  profile: Profile | null = null;

  async find() {
    return this.profile;
  }

  async save(profile: Profile) {
    this.profile = profile;
  }
}

export class FakePdfGenerator implements PdfGenerator {
  calls: PdfCatalogInput[] = [];
  nextUri = 'file:///catalog-pdfs/catalogo.pdf';

  async generate(input: PdfCatalogInput) {
    this.calls.push(input);
    return this.nextUri;
  }
}

export class FakeShareService implements NativeShareService {
  calls: Array<{ uri: string; title: string }> = [];

  async shareFile(uri: string, title: string) {
    this.calls.push({ uri, title });
  }
}

export class FakeImagePickerService implements ImagePickerService {
  constructor(private readonly uri?: string) {}

  async pickImage(_source: ImageSource) {
    return this.uri;
  }
}

export function makeFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: 'fam_1',
    name: 'General',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prd_1',
    name: 'Producto',
    code: undefined,
    price: 1000,
    stock: 10,
    format: 'unit',
    familyId: 'fam_1',
    photoUri: 'file:///product-images/product.jpg',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeCatalog(overrides: Partial<Catalog> = {}): Catalog {
  return {
    id: 'cat_1',
    name: 'Catálogo',
    familyId: 'fam_1',
    format: 'grid-4x5',
    productIds: ['prd_1'],
    pdfUri: 'file:///catalog-pdfs/catalogo.pdf',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile',
    businessName: 'Mi Marca',
    ownerName: 'Vendedor',
    phone: '+56912345678',
    email: 'ventas@example.com',
    address: 'Santiago',
    website: '@mimarca',
    logoUri: 'file:///profile/logo.jpg',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export interface InMemoryBackupRepositoryDeps {
  familyRepo?: FamilyRepository;
  productRepo?: ProductRepository;
  catalogRepo?: CatalogRepository;
  profileRepo?: ProfileRepository;
  orderRepo?: OrderRepository;
  supplierRepo?: SupplierRepository;
}

export class InMemoryBackupRepository implements BackupRepository {
  snapshots = new Map<string, BackupSnapshot>();
  payloads = new Map<string, BackupPayload>();
  private deps: InMemoryBackupRepositoryDeps;

  constructor(deps: InMemoryBackupRepositoryDeps = {}) {
    this.deps = deps;
  }

  async saveSnapshot(snapshot: BackupSnapshot, payload: BackupPayload): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
    this.payloads.set(snapshot.id, payload);
  }

  async findAll(): Promise<BackupSnapshot[]> {
    return [...this.snapshots.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findById(id: string): Promise<BackupSnapshot | null> {
    return this.snapshots.get(id) ?? null;
  }

  async loadPayload(id: string): Promise<BackupPayload | null> {
    return this.payloads.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.snapshots.delete(id);
    this.payloads.delete(id);
  }

  async deleteAll(): Promise<void> {
    this.snapshots.clear();
    this.payloads.clear();
  }

  async count(): Promise<number> {
    return this.snapshots.size;
  }

  async transactionalRestore(data: TransactionalRestoreData): Promise<void> {
    this.lastRestoreData = { ...data };

    const { familyRepo, productRepo, catalogRepo, profileRepo, orderRepo, supplierRepo } = this.deps;

    if (familyRepo) {
      for (const f of await familyRepo.findAll()) await familyRepo.delete(f.id);
      for (const f of data.families) await familyRepo.create(f);
    }
    if (productRepo) {
      for (const p of await productRepo.findAll()) await productRepo.delete(p.id);
      for (const p of data.products) await productRepo.create(p);
    }
    if (catalogRepo) {
      for (const c of await catalogRepo.findAll()) await catalogRepo.delete(c.id);
      for (const c of data.catalogs) await catalogRepo.create(c);
    }
    if (profileRepo) {
      if (data.profile) await profileRepo.save(data.profile);
    }
    if (orderRepo) {
      for (const o of await orderRepo.findAll()) await orderRepo.delete(o.id);
      for (const o of data.orders) await orderRepo.save(o);
    }
    if (supplierRepo) {
      for (const s of await supplierRepo.findAll()) await supplierRepo.delete(s.id);
      for (const s of data.suppliers) await supplierRepo.create(s);
    }
  }

  lastRestoreData: TransactionalRestoreData | null = null;
}

export function makeBackupSnapshot(overrides: Partial<BackupSnapshot> = {}): BackupSnapshot {
  return {
    id: 'bkp_1',
    label: 'Test backup',
    trigger: 'manual',
    familiesCount: 1,
    productsCount: 1,
    catalogsCount: 0,
    ordersCount: 0,
    suppliersCount: 0,
    hasProfile: true,
    checksum: 'abc123',
    filePath: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function computeBackupChecksum(payload: BackupPayload): string {
  return computeChecksum({
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
}

export class InMemoryOrderRepository implements OrderRepository {
  orders = new Map<string, Order>();
  private productRepo: InMemoryProductRepository | null;

  constructor(productRepo?: InMemoryProductRepository) {
    this.productRepo = productRepo ?? null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async update(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.orders.delete(id);
  }

  async deleteAndRestoreStock(id: string): Promise<void> {
    const order = this.orders.get(id);
    if (!order) throw new Error('Pedido no encontrado');

    if (this.productRepo) {
      for (const item of order.items) {
        const product = this.productRepo.products.get(item.productId);
        if (!product) {
          throw new Error(`No se encontró el producto ${item.productId}; el pedido no fue eliminado`);
        }
      }
      for (const item of order.items) {
        const product = this.productRepo.products.get(item.productId)!;
        this.productRepo.products.set(item.productId, {
          ...product,
          stock: product.stock + item.quantity,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    this.orders.delete(id);
  }

  async getMaxOrderNumber(): Promise<number> {
    let max = 0;
    for (const order of this.orders.values()) {
      if (order.orderNumber > max) max = order.orderNumber;
    }
    return max;
  }

  async saveAndDecrementStock(
    order: Order,
    stockChanges: Array<{ productId: string; quantity: number }>,
    clearCart?: () => Promise<void>,
  ): Promise<{ orderNumber: number }> {
    for (const change of stockChanges) {
      if (this.productRepo) {
        const product = this.productRepo.products.get(change.productId);
        if (!product || product.stock < change.quantity) {
          throw new Error(`Stock insuficiente para producto ${change.productId}: no se pudo descontar ${change.quantity} unidades`);
        }
      }
    }

    const maxOrderNumber = await this.getMaxOrderNumber();
    const orderNumber = maxOrderNumber + 1;

    this.orders.set(order.id, { ...order, orderNumber });

    if (this.productRepo) {
      for (const change of stockChanges) {
        const product = this.productRepo.products.get(change.productId);
        if (product) {
          this.productRepo.products.set(change.productId, {
            ...product,
            stock: product.stock - change.quantity,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    if (clearCart) {
      await clearCart();
    }

    return { orderNumber };
  }
}

export class InMemoryCartRepository implements CartRepository {
  private items: CartItem[] = [];

  async getItems(): Promise<CartItem[]> {
    return [...this.items];
  }

  async saveItems(items: CartItem[]): Promise<void> {
    this.items = [...items];
  }

  async clear(): Promise<void> {
    this.items = [];
  }
}

export class FakeOrderPdfGenerator implements OrderPdfGeneratorPort {
  lastCall: { order: Order; profile: Profile | null } | null = null;
  nextUri = 'file:///order-pdfs/order.pdf';

  async generate(order: Order, profile: Profile | null): Promise<string> {
    this.lastCall = { order, profile };
    return this.nextUri;
  }
}

export class InMemorySupplierRepository implements SupplierRepository {
  suppliers = new Map<string, Supplier>();

  async create(supplier: Supplier) {
    this.suppliers.set(supplier.id, supplier);
  }

  async update(supplier: Supplier) {
    this.suppliers.set(supplier.id, supplier);
  }

  async delete(id: string) {
    this.suppliers.delete(id);
  }

  async findAll() {
    return [...this.suppliers.values()];
  }

  async findById(id: string) {
    return this.suppliers.get(id) ?? null;
  }
}

export class InMemoryPurchaseCartRepository implements PurchaseCartRepository {
  private items: PurchaseCartItem[] = [];

  async getItems(): Promise<PurchaseCartItem[]> {
    return [...this.items];
  }

  async saveItems(items: PurchaseCartItem[]): Promise<void> {
    this.items = [...items];
  }

  async clear(): Promise<void> {
    this.items = [];
  }
}

export class InMemoryQuotationRepository implements QuotationRepository {
  quotations = new Map<string, Quotation>();

  async save(quotation: Quotation) {
    this.quotations.set(quotation.id, quotation);
  }

  async update(quotation: Quotation) {
    this.quotations.set(quotation.id, quotation);
  }

  async findAll() {
    return [...this.quotations.values()];
  }

  async findById(id: string) {
    return this.quotations.get(id) ?? null;
  }

  async delete(id: string) {
    this.quotations.delete(id);
  }

  async getMaxQuotationNumber() {
    let max = 0;
    for (const q of this.quotations.values()) {
      if (q.quotationNumber > max) max = q.quotationNumber;
    }
    return max;
  }
}
