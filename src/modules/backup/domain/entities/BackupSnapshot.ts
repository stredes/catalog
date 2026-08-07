import { Family } from '../../../families/domain/entities/Family';
import { Product } from '../../../products/domain/entities/product';
import { Catalog } from '../../../catalogs/domain/entities/Catalog';
import { Profile } from '../../../profile/domain/entities/profile';
import { Order } from '../../../orders/domain/entities/Order';
import { Supplier } from '../../../suppliers/domain/entities/Supplier';
import { Quotation } from '../../../quotations/domain/entities/Quotation';
import { Client } from '../../../clients/domain/entities/Client';
import { Invoice } from '../../../invoices/domain/entities/Invoice';
import { PurchaseDocument } from '../../../purchase-documents/domain/entities/PurchaseDocument';

export type BackupTrigger = 'manual' | 'auto-before-delete' | 'auto-periodic' | 'auto-before-seed';

export type BackupSnapshot = {
  id: string;
  label: string;
  trigger: BackupTrigger;
  familiesCount: number;
  productsCount: number;
  catalogsCount: number;
  ordersCount: number;
  suppliersCount: number;
  invoicesCount: number;
  quotationsCount: number;
  clientsCount: number;
  purchaseDocumentsCount: number;
  hasProfile: boolean;
  checksum: string;
  filePath: string;
  createdAt: string;
};

export type BackupImageMap = Record<string, string>;

export type BackupPayload = {
  schemaVersion: number;
  createdAt: string;
  families: Family[];
  products: Product[];
  catalogs: Catalog[];
  profile: Profile | null;
  orders: Order[];
  suppliers: Supplier[];
  quotations: Quotation[];
  clients?: Client[];
  invoices?: Invoice[];
  purchaseDocuments: PurchaseDocument[];
  images: BackupImageMap;
  imageFiles?: Record<string, string>;
};
