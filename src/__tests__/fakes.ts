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
import { BackupRepository } from '../modules/backup/domain/repositories/BackupRepository';
import { Order } from '../modules/orders/domain/entities/Order';
import { OrderRepository } from '../modules/orders/domain/repositories/OrderRepository';
import { CartItem } from '../modules/orders/domain/entities/CartItem';
import { CartRepository } from '../modules/orders/domain/repositories/CartRepository';
import { OrderPdfGeneratorPort } from '../modules/orders/application/use-cases/GenerateOrderPdfUseCase';

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

export class InMemoryBackupRepository implements BackupRepository {
  snapshots = new Map<string, BackupSnapshot>();
  payloads = new Map<string, BackupPayload>();

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
}

export function makeBackupSnapshot(overrides: Partial<BackupSnapshot> = {}): BackupSnapshot {
  return {
    id: 'bkp_1',
    label: 'Test backup',
    trigger: 'manual',
    familiesCount: 1,
    productsCount: 1,
    catalogsCount: 0,
    hasProfile: true,
    checksum: 'abc123',
    filePath: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export class InMemoryOrderRepository implements OrderRepository {
  orders = new Map<string, Order>();

  async save(order: Order): Promise<void> {
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
