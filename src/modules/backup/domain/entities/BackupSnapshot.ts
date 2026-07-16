import { Family } from '../../../families/domain/entities/Family';
import { Product } from '../../../products/domain/entities/product';
import { Catalog } from '../../../catalogs/domain/entities/Catalog';
import { Profile } from '../../../profile/domain/entities/profile';

export type BackupTrigger = 'manual' | 'auto-before-delete' | 'auto-periodic' | 'auto-before-seed';

export type BackupSnapshot = {
  id: string;
  label: string;
  trigger: BackupTrigger;
  familiesCount: number;
  productsCount: number;
  catalogsCount: number;
  hasProfile: boolean;
  checksum: string;
  filePath: string;
  createdAt: string;
};

export type BackupPayload = {
  schemaVersion: number;
  createdAt: string;
  families: Family[];
  products: Product[];
  catalogs: Catalog[];
  profile: Profile | null;
};
