import { Family } from '../entities/Family';

export interface FamilyRepository {
  create(family: Family): Promise<void>;
  update(family: Family): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Family[]>;
  findById(id: string): Promise<Family | null>;
}
