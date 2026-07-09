export type CatalogFormat =
  | 'grid-2'
  | 'grid-3'
  | 'grid-4x5'
  | 'grid-3x7'
  | 'simple-list'
  | 'premium-cover';

export type Catalog = {
  id: string;
  name: string;
  familyId: string;
  familyIds?: string[];
  format: CatalogFormat;
  productIds: string[];
  pdfUri: string;
  createdAt: string;
};
