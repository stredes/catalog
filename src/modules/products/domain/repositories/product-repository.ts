import { Product } from '../entities/product';

export interface ProductRepository {
  create(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findByFamilyId(familyId: string): Promise<Product[]>;
}
