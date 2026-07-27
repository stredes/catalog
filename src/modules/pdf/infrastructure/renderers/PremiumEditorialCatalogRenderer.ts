import { buildEditorialCatalogHtml } from '../../templates/editorial';
import {
  CatalogRenderer,
  CatalogRenderInput,
  PrintableProduct,
  PrintableProfile,
} from '../../domain/CatalogRenderer';

export class PremiumEditorialCatalogRenderer implements CatalogRenderer {
  readonly format = 'premium-cover' as const;

  render(
    input: CatalogRenderInput,
    productsForPdf: PrintableProduct[],
    profile: PrintableProfile | undefined,
  ): string {
    return buildEditorialCatalogHtml(
      input,
      productsForPdf,
      profile,
    );
  }
}
