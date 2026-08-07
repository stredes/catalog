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
import { AsyncStoragePurchaseCartRepository } from '../modules/orders/infrastructure/repositories/AsyncStoragePurchaseCartRepository';
import {
  AddToCartUseCase,
  UpdateCartItemUseCase,
  UpdateCartItemDiscountUseCase,
  UpdateCartItemPriceUseCase,
  RemoveFromCartUseCase,
  ClearCartUseCase,
  GetCartItemsUseCase,
} from '../modules/orders/application/use-cases/CartUseCases';
import {
  GetPurchaseCartItemsUseCase,
  AddToPurchaseCartUseCase,
  UpdatePurchaseCartItemUseCase,
  UpdatePurchaseCartItemDiscountUseCase,
  RemoveFromPurchaseCartUseCase,
  ClearPurchaseCartUseCase,
} from '../modules/orders/application/use-cases/PurchaseCartUseCases';
import {
  GenerateOrderUseCase,
  GetOrdersUseCase,
  DeleteOrderUseCase,
  UpdateOrderUseCase,
  ToggleOrderStatusUseCase,
  RecordPaymentUseCase,
} from '../modules/orders/application/use-cases/OrderUseCases';
import { GenerateOrderPdfUseCase } from '../modules/orders/application/use-cases/GenerateOrderPdfUseCase';
import { OrderPdfGenerator } from '../modules/orders/infrastructure/OrderPdfGenerator';
import { SQLiteBackupRepository } from '../modules/backup/infrastructure/repositories/SQLiteBackupRepository';
import { ChangeDetector } from '../modules/backup/infrastructure/services/ChangeDetector';
import { AutoBackupService } from '../modules/backup/infrastructure/services/AutoBackupService';
import { CreateBackupUseCase } from '../modules/backup/application/use-cases/CreateBackupUseCase';
import { ListBackupsUseCase } from '../modules/backup/application/use-cases/ListBackupsUseCase';
import { RestoreBackupUseCase } from '../modules/backup/application/use-cases/RestoreBackupUseCase';
import { collectBackupImages, restoreBackupImages } from '../modules/backup/infrastructure/services/BackupImageCollector';
import { SqliteAnalyticsRepository } from '../shared/infrastructure/SqliteAnalyticsRepository';
import { AnalyticsPort } from '../shared/domain/AnalyticsPort';
import { SentryErrorReporter } from '../shared/infrastructure/SentryErrorReporter';
import { ErrorReporter } from '../shared/domain/ErrorReporter';
import {
  CreateSupplierUseCase,
  UpdateSupplierUseCase,
  DeleteSupplierUseCase,
} from '../modules/suppliers/application/use-cases/SupplierUseCases';
import { SQLiteSupplierRepository } from '../modules/suppliers/infrastructure/repositories/SQLiteSupplierRepository';
import {
  CreateClientUseCase,
  UpdateClientUseCase,
  DeleteClientUseCase,
} from '../modules/clients/application/use-cases/ClientUseCases';
import { SQLiteClientRepository } from '../modules/clients/infrastructure/repositories/SQLiteClientRepository';
import {
  CreateQuotationUseCase,
} from '../modules/quotations/application/use-cases/CreateQuotationUseCase';
import { GetQuotationsUseCase } from '../modules/quotations/application/use-cases/GetQuotationsUseCase';
import { DeleteQuotationUseCase } from '../modules/quotations/application/use-cases/DeleteQuotationUseCase';
import { UpdateQuotationUseCase } from '../modules/quotations/application/use-cases/UpdateQuotationUseCase';
import { UpdateQuotationStatusUseCase } from '../modules/quotations/application/use-cases/UpdateQuotationStatusUseCase';
import { GenerateQuotationPdfUseCase } from '../modules/quotations/application/use-cases/GenerateQuotationPdfUseCase';
import { SQLiteQuotationRepository } from '../modules/quotations/infrastructure/repositories/SQLiteQuotationRepository';
import { QuotationPdfGenerator } from '../modules/quotations/infrastructure/QuotationPdfGenerator';
import {
  CreateInvoiceUseCase,
  UpdateInvoiceUseCase,
  DeleteInvoiceUseCase,
  UpdateInvoiceStatusUseCase,
  GetInvoicesUseCase,
} from '../modules/invoices/application/use-cases/InvoiceUseCases';
import { SQLiteInvoiceRepository } from '../modules/invoices/infrastructure/repositories/SQLiteInvoiceRepository';
import { SQLiteRecordHistoryRepository } from '../modules/invoices/infrastructure/repositories/SQLiteRecordHistoryRepository';
import { SQLitePurchaseDocumentRepository } from '../modules/purchase-documents/infrastructure/repositories/SQLitePurchaseDocumentRepository';
import {
  ApprovePurchaseOrderUseCase,
  GetPurchaseOrdersUseCase,
  RejectPurchaseOrderUseCase,
} from '../modules/purchase-documents/application/use-cases/PurchaseOrderUseCases';

type Dependencies = ReturnType<typeof buildDependencies>;

const DependenciesContext = createContext<Dependencies | null>(null);

function buildDependencies() {
  const productRepository = new SQLiteProductRepository();
  const familyRepository = new SQLiteFamilyRepository();
  const catalogRepository = new SQLiteCatalogRepository();
  const profileRepository = new SQLiteProfileRepository();
  const orderRepository = new SQLiteOrderRepository();
  const cartRepository = new AsyncStorageCartRepository();
  const purchaseCartRepository = new AsyncStoragePurchaseCartRepository();
  const backupRepository = new SQLiteBackupRepository();
  const supplierRepository = new SQLiteSupplierRepository();
  const quotationRepository = new SQLiteQuotationRepository();
  const clientRepository = new SQLiteClientRepository();
  const invoiceRepository = new SQLiteInvoiceRepository();
  const recordHistoryRepository = new SQLiteRecordHistoryRepository();
  const purchaseDocumentRepository = new SQLitePurchaseDocumentRepository();
  const pdfGenerator = new ExpoPdfGenerator();
  const shareService = new ExpoNativeShareService();
  const imagePicker = new ExpoImagePickerService();
  const preferences: PreferencesPort = new AsyncStoragePreferencesAdapter();
  const auth: AuthPort = new LocalAuthAdapter(preferences);
  const orderPdfGenerator = new OrderPdfGenerator();
  const quotationPdfGenerator = new QuotationPdfGenerator();
  const analytics: AnalyticsPort = new SqliteAnalyticsRepository();
  const errorReporter: ErrorReporter = new SentryErrorReporter();

    const seed = new SeedUseCase(familyRepository, productRepository);

  const createBackupUseCase = new CreateBackupUseCase(
    backupRepository,
    familyRepository,
    productRepository,
    catalogRepository,
    profileRepository,
    orderRepository,
    supplierRepository,
    quotationRepository,
    clientRepository,
    invoiceRepository,
    purchaseDocumentRepository,
    collectBackupImages,
  );

  const changeDetector = new ChangeDetector(
    familyRepository,
    productRepository,
    catalogRepository,
    profileRepository,
    orderRepository,
    supplierRepository,
    invoiceRepository,
    quotationRepository,
    clientRepository,
    purchaseDocumentRepository,
  );

  const autoBackupService = new AutoBackupService(
    createBackupUseCase,
    changeDetector,
    backupRepository,
  );

    return {
      repositories: {
        products: productRepository,
        families: familyRepository,
        catalogs: catalogRepository,
        profile: profileRepository,
        orders: orderRepository,
        cart: cartRepository,
        purchaseCart: purchaseCartRepository,
        backup: backupRepository,
        suppliers: supplierRepository,
        quotations: quotationRepository,
        clients: clientRepository,
        invoices: invoiceRepository,
        recordHistory: recordHistoryRepository,
        purchaseDocuments: purchaseDocumentRepository,
      },
      services: {
        preferences,
        auth,
        share: shareService,
        autoBackup: autoBackupService,
        analytics,
        errorReporter,
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
        deleteFamily: new DeleteFamilyUseCase(familyRepository, productRepository),
        generateCatalogPdf: new GenerateCatalogPdfUseCase(
          catalogRepository,
          familyRepository,
          productRepository,
          pdfGenerator,
          profileRepository,
          analytics,
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
        updateCartItemPrice: new UpdateCartItemPriceUseCase(cartRepository),
        removeFromCart: new RemoveFromCartUseCase(cartRepository),
        updateCartItemDiscount: new UpdateCartItemDiscountUseCase(cartRepository),
        clearCart: new ClearCartUseCase(cartRepository),
        getPurchaseCartItems: new GetPurchaseCartItemsUseCase(purchaseCartRepository),
        addToPurchaseCart: new AddToPurchaseCartUseCase(purchaseCartRepository),
        updatePurchaseCartItem: new UpdatePurchaseCartItemUseCase(purchaseCartRepository),
        updatePurchaseCartItemDiscount: new UpdatePurchaseCartItemDiscountUseCase(purchaseCartRepository),
        removeFromPurchaseCart: new RemoveFromPurchaseCartUseCase(purchaseCartRepository),
        clearPurchaseCart: new ClearPurchaseCartUseCase(purchaseCartRepository),
        generateOrder: new GenerateOrderUseCase(orderRepository, cartRepository, productRepository),
        getOrders: new GetOrdersUseCase(orderRepository),
        deleteOrder: new DeleteOrderUseCase(orderRepository),
        updateOrder: new UpdateOrderUseCase(orderRepository, productRepository),
        toggleOrderStatus: new ToggleOrderStatusUseCase(orderRepository),
        recordPayment: new RecordPaymentUseCase(orderRepository),
        generateOrderPdf: new GenerateOrderPdfUseCase(orderPdfGenerator),
        createBackup: createBackupUseCase,
        listBackups: new ListBackupsUseCase(backupRepository),
        restoreBackup: new RestoreBackupUseCase(
          backupRepository,
          familyRepository,
          productRepository,
          catalogRepository,
          profileRepository,
          orderRepository,
          supplierRepository,
          quotationRepository,
          invoiceRepository,
          clientRepository,
          purchaseDocumentRepository,
          restoreBackupImages,
          collectBackupImages,
        ),
        seed,
        createSupplier: new CreateSupplierUseCase(supplierRepository),
        updateSupplier: new UpdateSupplierUseCase(supplierRepository),
        deleteSupplier: new DeleteSupplierUseCase(supplierRepository),
        createQuotation: new CreateQuotationUseCase(quotationRepository),
        getQuotations: new GetQuotationsUseCase(quotationRepository),
        deleteQuotation: new DeleteQuotationUseCase(quotationRepository),
        updateQuotation: new UpdateQuotationUseCase(quotationRepository),
        updateQuotationStatus: new UpdateQuotationStatusUseCase(quotationRepository),
        generateQuotationPdf: new GenerateQuotationPdfUseCase(quotationPdfGenerator),
        createClient: new CreateClientUseCase(clientRepository),
        updateClient: new UpdateClientUseCase(clientRepository),
        deleteClient: new DeleteClientUseCase(clientRepository),
        createInvoice: new CreateInvoiceUseCase(invoiceRepository),
        updateInvoice: new UpdateInvoiceUseCase(invoiceRepository),
        deleteInvoice: new DeleteInvoiceUseCase(invoiceRepository),
        updateInvoiceStatus: new UpdateInvoiceStatusUseCase(invoiceRepository),
        getInvoices: new GetInvoicesUseCase(invoiceRepository),
        getPurchaseOrders: new GetPurchaseOrdersUseCase(purchaseDocumentRepository),
        approvePurchaseOrder: new ApprovePurchaseOrderUseCase(purchaseDocumentRepository),
        rejectPurchaseOrder: new RejectPurchaseOrderUseCase(purchaseDocumentRepository),
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
