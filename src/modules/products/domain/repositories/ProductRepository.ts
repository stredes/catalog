import { Product } from '../entities/product';

export interface ProductRepository {
  create(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  updateStock(id: string, stock: number): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByFamily(familyId: string): Promise<Product[]>;
}
