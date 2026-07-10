import { describe, expect, it } from 'vitest';
import {
  FakePdfGenerator,
  FakeShareService,
  InMemoryCatalogRepository,
  InMemoryFamilyRepository,
  InMemoryProductRepository,
  InMemoryProfileRepository,
  makeCatalog,
  makeFamily,
  makeProduct,
  makeProfile,
} from '../../../../__tests__/fakes';
import {
  DeleteCatalogUseCase,
  DuplicateCatalogUseCase,
  GenerateCatalogPdfUseCase,
  ShareCatalogPdfUseCase,
} from './CatalogUseCases';

describe('Catalog use cases', () => {
  it('generates a catalog PDF filtered by family and persists history', async () => {
    const catalogs = new InMemoryCatalogRepository();
    const families = new InMemoryFamilyRepository();
    const products = new InMemoryProductRepository();
    const profile = new InMemoryProfileRepository();
    const pdfGenerator = new FakePdfGenerator();
    await families.create(makeFamily({ id: 'fam_audio', name: 'Audio' }));
    await products.create(makeProduct({ id: 'prd_1', familyId: 'fam_audio' }));
    await products.create(makeProduct({ id: 'prd_2', familyId: 'fam_other' }));
    await profile.save(makeProfile({ businessName: 'Audio Store' }));

    const catalog = await new GenerateCatalogPdfUseCase(
      catalogs,
      families,
      products,
      pdfGenerator,
      profile,
    ).execute({
      name: 'Catálogo audio',
      familyId: 'fam_audio',
      format: 'grid-4x5',
      productIds: ['prd_1'],
    });

    expect(catalog.id).toMatch(/^cat_/);
    expect(catalog.pdfUri).toBe('file:///catalog-pdfs/catalogo.pdf');
    expect(await catalogs.findById(catalog.id)).toEqual(catalog);
    expect(pdfGenerator.calls).toHaveLength(1);
    expect(pdfGenerator.calls[0].products.map((product) => product.id)).toEqual([
      'prd_1',
    ]);
    expect(pdfGenerator.calls[0].profile?.businessName).toBe('Audio Store');
  });

  it('fails when generating a catalog for a missing family', async () => {
    await expect(
      new GenerateCatalogPdfUseCase(
        new InMemoryCatalogRepository(),
        new InMemoryFamilyRepository(),
        new InMemoryProductRepository(),
        new FakePdfGenerator(),
        new InMemoryProfileRepository(),
      ).execute({
        name: 'Catálogo',
        familyId: 'missing',
        format: 'grid-3x7',
        productIds: ['prd_1'],
      }),
    ).rejects.toThrow('Familia no encontrada: missing');
  });

  it('rejects catalog generation without selected products', async () => {
    const families = new InMemoryFamilyRepository();
    await families.create(makeFamily());

    await expect(
      new GenerateCatalogPdfUseCase(
        new InMemoryCatalogRepository(),
        families,
        new InMemoryProductRepository(),
        new FakePdfGenerator(),
        new InMemoryProfileRepository(),
      ).execute({
        name: 'Catálogo',
        familyId: 'fam_1',
        format: 'grid-2',
        productIds: [],
      }),
    ).rejects.toThrow('Selecciona al menos un producto');
  });

  it('generates a catalog with multiple families', async () => {
    const catalogs = new InMemoryCatalogRepository();
    const families = new InMemoryFamilyRepository();
    const products = new InMemoryProductRepository();
    const profile = new InMemoryProfileRepository();
    const pdfGenerator = new FakePdfGenerator();

    await families.create(makeFamily({ id: 'fam_tazas', name: 'Tazas' }));
    await families.create(makeFamily({ id: 'fam_poleras', name: 'Poleras' }));
    await products.create(makeProduct({ id: 'prd_taza1', name: 'Taza blanca', familyId: 'fam_tazas' }));
    await products.create(makeProduct({ id: 'prd_taza2', name: 'Taza sublimada', familyId: 'fam_tazas' }));
    await products.create(makeProduct({ id: 'prd_polera1', name: 'Polera algodon', familyId: 'fam_poleras' }));
    await profile.save(makeProfile());

    const catalog = await new GenerateCatalogPdfUseCase(
      catalogs,
      families,
      products,
      pdfGenerator,
      profile,
    ).execute({
      name: 'Catálogo combinado',
      familyIds: ['fam_tazas', 'fam_poleras'],
      productIds: ['prd_taza1', 'prd_taza2', 'prd_polera1'],
      format: 'grid-4x5',
    });

    expect(catalog.familyIds).toEqual(['fam_tazas', 'fam_poleras']);
    expect(catalog.productIds).toHaveLength(3);
    expect(pdfGenerator.calls[0].families).toHaveLength(2);
    expect(pdfGenerator.calls[0].families.map((f: any) => f.id)).toEqual(['fam_tazas', 'fam_poleras']);
  });

  it('shares a generated catalog through the sharing port', async () => {
    const shareService = new FakeShareService();
    const catalog = makeCatalog({ name: 'Catálogo premium' });

    await new ShareCatalogPdfUseCase(shareService).execute(catalog);

    expect(shareService.calls).toEqual([
      { uri: catalog.pdfUri, title: 'Catálogo premium' },
    ]);
  });

  it('duplicates a catalog history record', async () => {
    const repository = new InMemoryCatalogRepository();
    const original = makeCatalog({ name: 'Base' });
    await repository.create(original);

    const copy = await new DuplicateCatalogUseCase(repository).execute(original.id);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Base copia');
    expect(copy.pdfUri).toBe(original.pdfUri);
    expect(await repository.findById(copy.id)).toEqual(copy);
  });

  it('fails when duplicating a missing catalog', async () => {
    const repository = new InMemoryCatalogRepository();

    await expect(
      new DuplicateCatalogUseCase(repository).execute('missing'),
    ).rejects.toThrow('Catálogo no encontrado');
  });

  it('deletes a catalog history record', async () => {
    const repository = new InMemoryCatalogRepository();
    const catalog = makeCatalog();
    await repository.create(catalog);

    await new DeleteCatalogUseCase(repository).execute(catalog.id);

    expect(await repository.findById(catalog.id)).toBeNull();
  });
});
