import { CatalogFormat, CatalogPurpose } from '../../catalogs/domain/entities/Catalog';
import { Family } from '../../families/domain/entities/Family';
import { Product } from '../../products/domain/entities/product';
import { Profile } from '../../profile/domain/entities/profile';
import { EditorialContent } from '../../editorial/domain/entities/EditorialContent';

export type PrintableProduct = Product & {
  pdfImageSrc: string | null | undefined;
};

export type PrintableProfile = Profile & {
  pdfLogoSrc: string | null | undefined;
};

export type CatalogRenderInput = {
  catalogName: string;
  format: CatalogFormat;
  purpose?: CatalogPurpose;
  families: Family[];
  products: Product[];
  profile?: Profile | null;
  editorialContent?: EditorialContent;
};

export interface CatalogRenderer {
  readonly format: CatalogFormat;
  render(
    input: CatalogRenderInput,
    productsForPdf: PrintableProduct[],
    profile: PrintableProfile | undefined,
  ): string;
}
