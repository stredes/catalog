import { Product } from '../../../products/domain/entities/Product';
import { Family } from '../../../families/domain/entities/Family';
import { ContentGenerator } from '../../domain/services/ContentGenerator';
import type {
  EditorialContent,
  EditorialSectionContent,
  EditorialAboutContent,
  EditorialCategoryContent,
  EditorialProductContent,
} from '../../domain/entities/EditorialContent';

export class GenerateEditorialContentUseCase {
  private generator = new ContentGenerator();

  execute(
    families: Family[],
    products: Product[],
    businessName: string,
  ): EditorialContent {
    const selectedFamilies = families;
    const familyProductCounts = new Map<string, number>();
    for (const p of products) {
      familyProductCounts.set(p.familyId, (familyProductCounts.get(p.familyId) ?? 0) + 1);
    }

    const section: EditorialSectionContent = {
      title: this.generator.generateCatalogTitle(selectedFamilies[0]?.name ?? 'General'),
      subtitle: this.generator.generateCatalogSubtitle(selectedFamilies[0]?.name ?? 'General'),
      welcomeMessage: this.generator.generateCatalogWelcome(businessName, products.length),
      introduction: this.generator.generateCatalogIntroduction(businessName, selectedFamilies),
    };

    const about: EditorialAboutContent = {
      description: this.generator.generateAboutDescription(businessName),
      history: this.generator.generateAboutHistory(businessName),
      mission: this.generator.generateAboutMission(businessName),
      vision: this.generator.generateAboutVision(businessName),
      values: this.generator.generateAboutValues(businessName),
    };

    const categories: EditorialCategoryContent[] = selectedFamilies.map((f) => ({
      familyId: f.id,
      description: this.generator.generateCategoryDescription(
        f.name,
        familyProductCounts.get(f.id) ?? 0,
      ),
    }));

    const productsContent: EditorialProductContent[] = products.map((p) => {
      const fn = families.find((f) => f.id === p.familyId)?.name ?? '';
      return {
        productId: p.id,
        savedForFuture: false,
        description: this.generator.generateProductDescription(p, fn),
        benefits: this.generator.generateProductBenefits(p, fn),
        highlights: this.generator.generateProductHighlights(p, fn),
        uses: this.generator.generateProductUses(p, fn),
        specifications: this.generator.generateProductSpecifications(p, fn),
        quote: this.generator.generateProductQuote(p, fn),
        notes: '',
      };
    });

    return {
      mode: 'auto',
      section,
      about,
      categories,
      products: productsContent,
    };
  }
}

export class GenerateSectionContentUseCase {
  private generator = new ContentGenerator();

  execute(
    families: Family[],
    products: Product[],
    businessName: string,
  ): EditorialSectionContent {
    return {
      title: this.generator.generateCatalogTitle(families[0]?.name ?? 'General'),
      subtitle: this.generator.generateCatalogSubtitle(families[0]?.name ?? 'General'),
      welcomeMessage: this.generator.generateCatalogWelcome(businessName, products.length),
      introduction: this.generator.generateCatalogIntroduction(businessName, families),
    };
  }
}

export class GenerateAboutContentUseCase {
  private generator = new ContentGenerator();

  execute(businessName: string): EditorialAboutContent {
    return {
      description: this.generator.generateAboutDescription(businessName),
      history: this.generator.generateAboutHistory(businessName),
      mission: this.generator.generateAboutMission(businessName),
      vision: this.generator.generateAboutVision(businessName),
      values: this.generator.generateAboutValues(businessName),
    };
  }
}

export class GenerateCategoryContentUseCase {
  private generator = new ContentGenerator();

  execute(familyName: string, productCount: number): string {
    return this.generator.generateCategoryDescription(familyName, productCount);
  }
}

export class GenerateProductContentUseCase {
  private generator = new ContentGenerator();

  executeField(
    product: Product,
    familyName: string,
    field: 'description' | 'benefits' | 'highlights' | 'uses' | 'specifications' | 'quote',
  ): string {
    switch (field) {
      case 'description': return this.generator.generateProductDescription(product, familyName);
      case 'benefits': return this.generator.generateProductBenefits(product, familyName);
      case 'highlights': return this.generator.generateProductHighlights(product, familyName);
      case 'uses': return this.generator.generateProductUses(product, familyName);
      case 'specifications': return this.generator.generateProductSpecifications(product, familyName);
      case 'quote': return this.generator.generateProductQuote(product, familyName);
    }
  }
}
