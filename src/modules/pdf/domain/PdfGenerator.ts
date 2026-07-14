import { CatalogFormat } from '../../catalogs/domain/entities/Catalog';
import { Family } from '../../families/domain/entities/Family';
import { Product } from '../../products/domain/entities/product';
import { Profile } from '../../profile/domain/entities/profile';
import { EditorialContent } from '../../editorial/domain/entities/EditorialContent';

export type PdfCatalogInput = {
  catalogName: string;
  format: CatalogFormat;
  families: Family[];
  products: Product[];
  profile?: Profile | null;
  editorialContent?: EditorialContent;
};

export type CatalogGenerationStage =
  | 'preparing'
  | 'optimizing-images'
  | 'building-document'
  | 'generating-pdf'
  | 'completed'
  | 'error';

export type PdfGenerationProgress = {
  stage: CatalogGenerationStage;
  current?: number;
  total?: number;
  message?: string;
};

export interface PdfGenerator {
  generate(
    input: PdfCatalogInput,
    onProgress?: (progress: PdfGenerationProgress) => void,
  ): Promise<string>;
}
