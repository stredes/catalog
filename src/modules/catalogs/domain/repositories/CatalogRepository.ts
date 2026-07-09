import { Catalog } from '../entities/Catalog';

export interface CatalogRepository {
  create(catalog: Catalog): Promise<void>;
  update(catalog: Catalog): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Catalog[]>;
  findById(id: string): Promise<Catalog | null>;
}
