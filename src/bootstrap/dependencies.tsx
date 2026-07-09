import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import {
  DeleteCatalogUseCase,
  DuplicateCatalogUseCase,
  GenerateCatalogPdfUseCase,
  ShareCatalogPdfUseCase,
} from '../modules/catalogs/application/use-cases/CatalogUseCases';
import {
  CreateFamilyUseCase,
  DeleteFamilyUseCase,
  UpdateFamilyUseCase,
} from '../modules/families/application/use-cases/FamilyUseCases';
import { SQLiteFamilyRepository } from '../modules/families/infrastructure/repositories/SQLiteFamilyRepository';
import { ExpoPdfGenerator } from '../modules/pdf/infrastructure/ExpoPdfGenerator';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductsByFamilyUseCase,
  PickProductImageUseCase,
  UpdateProductUseCase,
} from '../modules/products/application/use-cases/ProductUseCases';
import { ExpoImagePickerService } from '../modules/products/infrastructure/repositories/ExpoImagePickerService';
import { SQLiteProductRepository } from '../modules/products/infrastructure/repositories/SQLiteProductRepository';
import {
  GetProfileUseCase,
  PickProfileLogoUseCase,
  SaveProfileUseCase,
} from '../modules/profile/application/use-cases/ProfileUseCases';
import { SQLiteProfileRepository } from '../modules/profile/infrastructure/repositories/SQLiteProfileRepository';
import { ExpoNativeShareService } from '../modules/sharing/infrastructure/ExpoNativeShareService';
import { SQLiteCatalogRepository } from '../modules/catalogs/infrastructure/repositories/SQLiteCatalogRepository';
import { SeedUseCase } from '../seed/SeedUseCase';

type Dependencies = ReturnType<typeof buildDependencies>;

const DependenciesContext = createContext<Dependencies | null>(null);

function buildDependencies() {
  const productRepository = new SQLiteProductRepository();
  const familyRepository = new SQLiteFamilyRepository();
  const catalogRepository = new SQLiteCatalogRepository();
  const profileRepository = new SQLiteProfileRepository();
  const pdfGenerator = new ExpoPdfGenerator();
  const shareService = new ExpoNativeShareService();
  const imagePicker = new ExpoImagePickerService();

    const seed = new SeedUseCase(familyRepository, productRepository);

    return {
      repositories: {
        products: productRepository,
        families: familyRepository,
        catalogs: catalogRepository,
        profile: profileRepository,
      },
      useCases: {
        createProduct: new CreateProductUseCase(productRepository),
        updateProduct: new UpdateProductUseCase(productRepository),
        deleteProduct: new DeleteProductUseCase(productRepository),
        getProductsByFamily: new GetProductsByFamilyUseCase(productRepository),
        pickProductImage: new PickProductImageUseCase(imagePicker),
        createFamily: new CreateFamilyUseCase(familyRepository),
        updateFamily: new UpdateFamilyUseCase(familyRepository),
        deleteFamily: new DeleteFamilyUseCase(familyRepository),
        generateCatalogPdf: new GenerateCatalogPdfUseCase(
          catalogRepository,
          familyRepository,
          productRepository,
          pdfGenerator,
          profileRepository,
        ),
        shareCatalogPdf: new ShareCatalogPdfUseCase(shareService),
        deleteCatalog: new DeleteCatalogUseCase(catalogRepository),
        duplicateCatalog: new DuplicateCatalogUseCase(catalogRepository),
        getProfile: new GetProfileUseCase(profileRepository),
        saveProfile: new SaveProfileUseCase(profileRepository),
        pickProfileLogo: new PickProfileLogoUseCase(imagePicker),
        seed,
      },
    };
}

export function DependencyProvider({ children }: PropsWithChildren) {
  const dependencies = useMemo(buildDependencies, []);

  return (
    <DependenciesContext.Provider value={dependencies}>
      {children}
    </DependenciesContext.Provider>
  );
}

export function useDependencies() {
  const dependencies = useContext(DependenciesContext);

  if (!dependencies) {
    throw new Error('DependenciesProvider no esta configurado');
  }

  return dependencies;
}
