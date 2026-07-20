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
  UpdateStockUseCase,
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
import { PreferencesPort } from '../shared/domain/PreferencesPort';
import { AsyncStoragePreferencesAdapter } from '../shared/infrastructure/AsyncStoragePreferencesAdapter';
import { AuthPort } from '../modules/auth/domain/AuthPort';
import { LocalAuthAdapter } from '../modules/auth/infrastructure/LocalAuthAdapter';
import { SQLiteOrderRepository } from '../modules/orders/infrastructure/repositories/SQLiteOrderRepository';
import { AsyncStorageCartRepository } from '../modules/orders/infrastructure/repositories/AsyncStorageCartRepository';
import {
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase,
  ClearCartUseCase,
  GetCartItemsUseCase,
} from '../modules/orders/application/use-cases/CartUseCases';
import {
  GenerateOrderUseCase,
  GetOrdersUseCase,
  DeleteOrderUseCase,
} from '../modules/orders/application/use-cases/OrderUseCases';
import { GenerateOrderPdfUseCase } from '../modules/orders/application/use-cases/GenerateOrderPdfUseCase';
import { OrderPdfGenerator } from '../modules/orders/infrastructure/OrderPdfGenerator';
import { SQLiteBackupRepository } from '../modules/backup/infrastructure/repositories/SQLiteBackupRepository';
import { ChangeDetector } from '../modules/backup/infrastructure/services/ChangeDetector';
import { AutoBackupService } from '../modules/backup/infrastructure/services/AutoBackupService';
import { CreateBackupUseCase } from '../modules/backup/application/use-cases/CreateBackupUseCase';
import { ListBackupsUseCase } from '../modules/backup/application/use-cases/ListBackupsUseCase';
import { RestoreBackupUseCase } from '../modules/backup/application/use-cases/RestoreBackupUseCase';

type Dependencies = ReturnType<typeof buildDependencies>;

const DependenciesContext = createContext<Dependencies | null>(null);

function buildDependencies() {
  const productRepository = new SQLiteProductRepository();
  const familyRepository = new SQLiteFamilyRepository();
  const catalogRepository = new SQLiteCatalogRepository();
  const profileRepository = new SQLiteProfileRepository();
  const orderRepository = new SQLiteOrderRepository();
  const cartRepository = new AsyncStorageCartRepository();
  const backupRepository = new SQLiteBackupRepository();
  const pdfGenerator = new ExpoPdfGenerator();
  const shareService = new ExpoNativeShareService();
  const imagePicker = new ExpoImagePickerService();
  const preferences: PreferencesPort = new AsyncStoragePreferencesAdapter();
  const auth: AuthPort = new LocalAuthAdapter(preferences);
  const orderPdfGenerator = new OrderPdfGenerator();

    const seed = new SeedUseCase(familyRepository, productRepository);

  const createBackupUseCase = new CreateBackupUseCase(
    backupRepository,
    familyRepository,
    productRepository,
    catalogRepository,
    profileRepository,
  );

  const changeDetector = new ChangeDetector(
    familyRepository,
    productRepository,
    catalogRepository,
    profileRepository,
  );

  const autoBackupService = new AutoBackupService(
    createBackupUseCase,
    changeDetector,
  );

    return {
      repositories: {
        products: productRepository,
        families: familyRepository,
        catalogs: catalogRepository,
        profile: profileRepository,
        orders: orderRepository,
        cart: cartRepository,
        backup: backupRepository,
      },
      services: {
        preferences,
        auth,
        share: shareService,
        autoBackup: changeDetector,
      },
      useCases: {
        createProduct: new CreateProductUseCase(productRepository),
        updateProduct: new UpdateProductUseCase(productRepository),
        deleteProduct: new DeleteProductUseCase(productRepository),
        updateStock: new UpdateStockUseCase(productRepository),
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
        getCartItems: new GetCartItemsUseCase(cartRepository),
        addToCart: new AddToCartUseCase(cartRepository),
        updateCartItem: new UpdateCartItemUseCase(cartRepository),
        removeFromCart: new RemoveFromCartUseCase(cartRepository),
        clearCart: new ClearCartUseCase(cartRepository),
        generateOrder: new GenerateOrderUseCase(orderRepository, cartRepository),
        getOrders: new GetOrdersUseCase(orderRepository),
        deleteOrder: new DeleteOrderUseCase(orderRepository),
        generateOrderPdf: new GenerateOrderPdfUseCase(orderPdfGenerator),
        createBackup: createBackupUseCase,
        listBackups: new ListBackupsUseCase(backupRepository),
        restoreBackup: new RestoreBackupUseCase(
          backupRepository,
          familyRepository,
          productRepository,
          catalogRepository,
          profileRepository,
        ),
        seed,
      },
      autoBackupService,
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
    throw new Error('DependenciesProvider no está configurado');
  }

  return dependencies;
}
