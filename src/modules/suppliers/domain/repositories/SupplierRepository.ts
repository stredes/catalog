import { Supplier } from '../entities/Supplier';

export interface SupplierRepository {
  create(supplier: Supplier): Promise<void>;
  update(supplier: Supplier): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Supplier[]>;
  findById(id: string): Promise<Supplier | null>;
}
