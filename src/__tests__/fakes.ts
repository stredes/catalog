import { Catalog } from '../modules/catalogs/domain/entities/Catalog';
import { CatalogRepository } from '../modules/catalogs/domain/repositories/CatalogRepository';
import { Family } from '../modules/families/domain/entities/Family';
import { FamilyRepository } from '../modules/families/domain/repositories/FamilyRepository';
import { PdfCatalogInput, PdfGenerator } from '../modules/pdf/domain/PdfGenerator';
import { Product } from '../modules/products/domain/entities/Product';
import { ImagePickerService, ImageSource } from '../modules/products/domain/repositories/ImagePickerService';
import { ProductRepository } from '../modules/products/domain/repositories/ProductRepository';
import { Profile } from '../modules/profile/domain/entities/Profile';
import { ProfileRepository } from '../modules/profile/domain/repositories/ProfileRepository';
import { NativeShareService } from '../modules/sharing/domain/NativeShareService';

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
