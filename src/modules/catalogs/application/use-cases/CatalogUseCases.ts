import { nowIso } from '../../../../shared/utils/dates';
import { createId } from '../../../../shared/utils/ids';
import { Catalog } from '../../domain/entities/Catalog';
import { CatalogRepository } from '../../domain/repositories/CatalogRepository';
import { Family } from '../../../families/domain/entities/Family';
import { FamilyRepository } from '../../../families/domain/repositories/FamilyRepository';
import { PdfGenerationProgress, PdfGenerator } from '../../../pdf/domain/PdfGenerator';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';
import { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import { NativeShareService } from '../../../sharing/domain/NativeShareService';
import { AnalyticsPort } from '../../../../shared/domain/AnalyticsPort';
import { CatalogInputDto, catalogSchema } from '../dtos/CatalogDtos';
import {
  catalogNoFamilySelectedError,
  familyNotFoundError,
  catalogNotFoundError,
  catalogPdfEmptyError,
} from '../../../../shared/errors/AppError';

export class GenerateCatalogPdfUseCase {
  constructor(
    private readonly catalogs: CatalogRepository,
    private readonly families: FamilyRepository,
    private readonly products: ProductRepository,
    private readonly pdfGenerator: PdfGenerator,
    private readonly profileRepository: ProfileRepository,
    private readonly analytics?: AnalyticsPort,
  ) {}

  async execute(
    input: CatalogInputDto,
    onProgress?: (progress: PdfGenerationProgress) => void,
  ) {
    const dto = catalogSchema.parse(input);
    const purpose = dto.purpose ?? 'catalog';
    let familyIds = dto.familyIds ?? (dto.familyId ? [dto.familyId] : []);

    const allProducts = await this.products.findAll();
    const selectedProducts = allProducts.filter((product) =>
      dto.productIds.includes(product.id),
    );

    if (familyIds.length === 0 && selectedProducts.length > 0) {
      const derived = new Set(selectedProducts.map((p) => p.familyId));
      familyIds = Array.from(derived);
    }

    if (familyIds.length === 0) {
      throw catalogNoFamilySelectedError();
    }

    const primaryFamilyId = dto.familyId ?? familyIds[0] ?? '';

    const foundFamilies: Family[] = [];

    for (const fid of familyIds) {
      const family = await this.families.findById(fid);
      if (!family) {
        throw familyNotFoundError(fid);
      }
      foundFamilies.push(family);
    }
    const profile = await this.profileRepository.find();
    const pdfUri = await this.pdfGenerator.generate(
      {
        catalogName: dto.name,
        families: foundFamilies,
        format: dto.format,
        purpose,
        products: selectedProducts,
        profile,
        editorialContent: dto.editorialContent,
      },
      onProgress,
    );

    if (!pdfUri || typeof pdfUri !== 'string' || pdfUri.trim().length === 0) {
      throw catalogPdfEmptyError();
    }

    const catalog: Catalog = {
      id: createId('cat'),
      name: dto.name,
      familyId: primaryFamilyId,
      familyIds: familyIds.length > 1 ? familyIds : undefined,
      format: dto.format,
      purpose,
      productIds: dto.productIds,
      pdfUri,
      createdAt: nowIso(),
    };

    await this.catalogs.create(catalog);

    this.analytics?.track({
      name: 'catalog_generated',
      properties: {
        format: dto.format,
        purpose,
        productCount: dto.productIds.length,
        familyCount: familyIds.length,
      },
    }).catch(() => {});

    return catalog;
  }
}

export class SaveCatalogHistoryUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  execute(catalog: Catalog) {
    return this.repository.create(catalog);
  }
}

export class ShareCatalogPdfUseCase {
  constructor(private readonly shareService: NativeShareService) {}

  execute(catalog: Catalog) {
    return this.shareService.shareFile(catalog.pdfUri, catalog.name);
  }

  shareFile(uri: string, title: string, mimeType?: string) {
    return this.shareService.shareFile(uri, title, mimeType);
  }
}

export class DeleteCatalogUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  execute(id: string) {
    return this.repository.delete(id);
  }
}

export class DuplicateCatalogUseCase {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(id: string) {
    const source = await this.repository.findById(id);

    if (!source) {
      throw catalogNotFoundError(id);
    }

    const copy: Catalog = {
      ...source,
      id: createId('cat'),
      name: `${source.name} copia`,
      createdAt: nowIso(),
    };
    await this.repository.create(copy);
    return copy;
  }
}
