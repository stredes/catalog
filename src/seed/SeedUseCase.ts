import { FamilyRepository } from '../modules/families/domain/repositories/FamilyRepository';
import { ProductRepository } from '../modules/products/domain/repositories/ProductRepository';
import { buildFamilies, buildProducts } from './seedData';

export class SeedUseCase {
  constructor(
    private readonly families: FamilyRepository,
    private readonly products: ProductRepository,
  ) {}

  async hasExistingData() {
    const existingFamilies = await this.families.findAll();
    return existingFamilies.length > 0;
  }

  async execute() {
    const existing = await this.products.findAll();
    for (const product of existing) {
      await this.products.delete(product.id);
    }

    const existingFamilies = await this.families.findAll();
    for (const family of existingFamilies) {
      await this.families.delete(family.id);
    }

    const families = buildFamilies();
    for (const family of families) {
      await this.families.create(family);
    }

    const products = buildProducts(families);
    for (const product of products) {
      await this.products.create(product);
    }

    return { families: families.length, products: products.length };
  }
}
