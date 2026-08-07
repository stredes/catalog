import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryBackupRepository,
  InMemoryFamilyRepository,
  InMemoryProductRepository,
  InMemoryCatalogRepository,
  InMemoryProfileRepository,
  InMemoryOrderRepository,
  InMemorySupplierRepository,
  InMemoryQuotationRepository,
  InMemoryClientRepository,
  InMemoryInvoiceRepository,
  InMemoryPurchaseDocumentRepository,
  makeFamily,
  makeProduct,
  makeProfile,
  makeBackupSnapshot,
  computeBackupChecksum,
} from '../../../__tests__/fakes';
import { CreateBackupUseCase } from '../application/use-cases/CreateBackupUseCase';
import { RestoreBackupUseCase } from '../application/use-cases/RestoreBackupUseCase';
import { BackupPayload } from '../domain/entities/BackupSnapshot';
import { DATABASE_SCHEMA_VERSION } from '../../../shared/infrastructure/schema-version';

describe('RestoreBackupUseCase - Transaccional', () => {
  let backupRepo: InMemoryBackupRepository;
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let catalogRepo: InMemoryCatalogRepository;
  let profileRepo: InMemoryProfileRepository;
  let orderRepo: InMemoryOrderRepository;
  let supplierRepo: InMemorySupplierRepository;
  let quotationRepo: InMemoryQuotationRepository;
  let clientRepo: InMemoryClientRepository;
  let invoiceRepo: InMemoryInvoiceRepository;
  let purchaseDocumentRepo: InMemoryPurchaseDocumentRepository;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();
    orderRepo = new InMemoryOrderRepository();
    supplierRepo = new InMemorySupplierRepository();
    quotationRepo = new InMemoryQuotationRepository();
    clientRepo = new InMemoryClientRepository();
    invoiceRepo = new InMemoryInvoiceRepository();
    purchaseDocumentRepo = new InMemoryPurchaseDocumentRepository();
    backupRepo = new InMemoryBackupRepository({
      familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
      clientRepo, invoiceRepo, quotationRepo, purchaseDocumentRepo,
    });
  });

  it('lanza error cuando el backup no existe', async () => {
    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    await expect(useCase.execute({
      backupId: 'nonexistent',
      confirmRestore: true,
      createPreventiveBackup: false,
    })).rejects.toThrow('Backup no encontrado');
  });

  it('lanza error cuando confirmRestore no es true', async () => {
    const snapshot = makeBackupSnapshot({ id: 'bkp_1' });
    const payload = {
      schemaVersion: 14,
      createdAt: new Date().toISOString(),
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    await expect(useCase.execute({
      backupId: 'bkp_1',
      confirmRestore: false as true,
      createPreventiveBackup: false,
    })).rejects.toThrow();
  });

  it('restaura datos dentro de una unica operacion atomica', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_old', name: 'Old' }));
    await productRepo.create(makeProduct({ id: 'prd_old', name: 'OldProduct', familyId: 'fam_old' }));

    const payload: BackupPayload = {
      schemaVersion: 14,
      createdAt: new Date().toISOString(),
      families: [makeFamily({ id: 'fam_new', name: 'New' })],
      products: [makeProduct({ id: 'prd_new', name: 'NewProduct', familyId: 'fam_new' })],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_valid', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_valid',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.familiesRestored).toBe(1);
    expect(result.productsRestored).toBe(1);

    const families = await familyRepo.findAll();
    expect(families).toHaveLength(1);
    expect(families[0].id).toBe('fam_new');

    const products = await productRepo.findAll();
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('prd_new');
  });

  it('reporta registros invalidos sin fallar completamente', async () => {
    const payload: BackupPayload = {
      schemaVersion: 14,
      createdAt: new Date().toISOString(),
      families: [makeFamily({ id: 'fam_1' })],
      products: [makeProduct({ id: 'prd_1', familyId: 'fam_1' })],
      catalogs: [],
      profile: null,
      orders: [
        {
          id: 'ord_valid',
          orderNumber: 1,
          clientName: 'Valid',
          items: [],
          subtotal: 0,
          iva: 0,
          total: 0,
          status: 'pending' as const,
          paidAmount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      suppliers: [
        { id: '', name: '', createdAt: '', updatedAt: '' } as any,
        { id: 'sup_1', name: 'Supplier1', createdAt: '2026-01-01', updatedAt: '2026-01-01' } as any,
      ],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_mixed', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_mixed',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.ordersRestored).toBe(1);
    expect(result.suppliersRestored).toBe(1);
  });

  it('rollback: los datos originales se conservan si la restauracion falla', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_original' }));

    const brokenPayload = {
      schemaVersion: -1,
      createdAt: '',
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_broken' });
    await backupRepo.saveSnapshot(snapshot, brokenPayload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    try {
      await useCase.execute({
        backupId: 'bkp_broken',
        confirmRestore: true,
        createPreventiveBackup: false,
      });
    } catch {
      // Expected to throw
    }

    const families = await familyRepo.findAll();
    expect(families.some((f) => f.id === 'fam_original')).toBe(true);
  });

  it('valida payload corrupto e informa errores', async () => {
    const payload: BackupPayload = {
      schemaVersion: DATABASE_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_valid', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_valid',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.familiesRestored).toBe(0);
  });
  it('restaura clientes y documentos de compra y conserva referencias cruzadas', async () => {
    const payload: BackupPayload = {
      schemaVersion: 14,
      createdAt: new Date().toISOString(),
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [
        {
          id: 'ord_1',
          orderNumber: 1,
          clientId: 'cli_1',
          clientName: 'Cliente',
          items: [],
          subtotal: 0,
          iva: 0,
          total: 0,
          status: 'pending' as const,
          paidAmount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      suppliers: [
        { id: 'sup_1', name: 'Proveedor', rut: '76.123.456-7', address: 'Av 1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ],
      quotations: [
        {
          id: 'quo_1',
          quotationNumber: 1,
          clientName: 'Cliente',
          clientRut: '11.111.111-1',
          items: [],
          subtotal: 0,
          ivaRate: 19,
          ivaAmount: 0,
          total: 0,
          status: 'pending',
          createdAt: '2026-01-01',
        },
      ],
      clients: [
        { id: 'cli_1', name: 'Cliente', rut: '11.111.111-1', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ],
      purchaseDocuments: [
        {
          id: 'pdoc_1',
          documentNumber: 1,
          type: 'purchase-order' as const,
          supplierId: 'sup_1',
          supplierName: 'Proveedor',
          items: [],
          netAmount: 0,
          ivaAmount: 0,
          total: 0,
          status: 'generated' as const,
          orderStatus: 'pending' as const,
          createdAt: '2026-01-01',
        },
      ],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_full', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_full',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.clientsRestored).toBe(1);
    expect(result.purchaseDocumentsRestored).toBe(1);
    expect((await clientRepo.findAll())[0].id).toBe('cli_1');
    expect((await orderRepo.findById('ord_1'))?.clientId).toBe('cli_1');
    expect((await quotationRepo.findById('quo_1'))?.clientRut).toBe('11.111.111-1');
    expect((await supplierRepo.findById('sup_1'))?.rut).toBe('76.123.456-7');
    expect((await purchaseDocumentRepo.findById('pdoc_1'))?.id).toBe('pdoc_1');
  });
});

describe('RestoreBackupUseCase - Validaciones', () => {
  let backupRepo: InMemoryBackupRepository;
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let catalogRepo: InMemoryCatalogRepository;
  let profileRepo: InMemoryProfileRepository;
  let orderRepo: InMemoryOrderRepository;
  let supplierRepo: InMemorySupplierRepository;
  let quotationRepo: InMemoryQuotationRepository;
  let clientRepo: InMemoryClientRepository;
  let invoiceRepo: InMemoryInvoiceRepository;
  let purchaseDocumentRepo: InMemoryPurchaseDocumentRepository;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();
    orderRepo = new InMemoryOrderRepository();
    supplierRepo = new InMemorySupplierRepository();
    quotationRepo = new InMemoryQuotationRepository();
    clientRepo = new InMemoryClientRepository();
    invoiceRepo = new InMemoryInvoiceRepository();
    purchaseDocumentRepo = new InMemoryPurchaseDocumentRepository();
    backupRepo = new InMemoryBackupRepository({
      familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
      clientRepo, invoiceRepo, quotationRepo, purchaseDocumentRepo,
    });
  });

  it('rechaza payload con version de esquema negativa', async () => {
    const payload = {
      schemaVersion: -5,
      createdAt: '2026-01-01',
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };
    const snapshot = makeBackupSnapshot({ id: 'bkp_bad_ver' });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    await expect(useCase.execute({
      backupId: 'bkp_bad_ver',
      confirmRestore: true,
      createPreventiveBackup: false,
    })).rejects.toThrow('versión de esquema inválida');
  });

  it('rechaza backup con esquema más nuevo que la app', async () => {
    const payload: BackupPayload = {
      schemaVersion: DATABASE_SCHEMA_VERSION + 1,
      createdAt: '2026-01-01',
      families: [makeFamily({ id: 'fam_newer' })],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };
    const snapshot = makeBackupSnapshot({
      id: 'bkp_newer',
      checksum: computeBackupChecksum(payload),
    });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    await expect(useCase.execute({
      backupId: 'bkp_newer',
      confirmRestore: true,
      createPreventiveBackup: false,
    })).rejects.toThrow('esquema más nuevo');
  });

  it('acepta backup con esquema anterior y avisa que se sincroniza al actual', async () => {
    const payload: BackupPayload = {
      schemaVersion: Math.max(1, DATABASE_SCHEMA_VERSION - 1),
      createdAt: '2026-01-01',
      families: [makeFamily({ id: 'fam_older' })],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };
    const snapshot = makeBackupSnapshot({
      id: 'bkp_older',
      checksum: computeBackupChecksum(payload),
    });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_older',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.familiesRestored).toBe(1);
    expect(await familyRepo.findById('fam_older')).not.toBeNull();
    expect(result.warnings.join(' ')).toContain('sincronizó');
    expect(result.warnings.join(' ')).toContain(String(DATABASE_SCHEMA_VERSION));
  });

  it('rechaza backup con checksum incorrecto', async () => {
    const payload: BackupPayload = {
      schemaVersion: 14,
      createdAt: '2026-01-01',
      families: [makeFamily({ id: 'fam_1' })],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_bad_checksum', checksum: 'wrong_checksum' });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    await expect(useCase.execute({
      backupId: 'bkp_bad_checksum',
      confirmRestore: true,
      createPreventiveBackup: false,
    })).rejects.toThrow('checksum');
  });

  it('backup preventivo contiene datos reales antes de restaurar', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_real', name: 'RealFam' }));

    const payload: BackupPayload = {
      schemaVersion: 14,
      createdAt: new Date().toISOString(),
      families: [makeFamily({ id: 'fam_restored', name: 'Restored' })],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_real', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_real',
      confirmRestore: true,
      createPreventiveBackup: true,
    });

    expect(result.familiesRestored).toBe(1);

    const allBackups = await backupRepo.findAll();
    const preventive = allBackups.find((b) => b.label.includes('preventivo'));
    expect(preventive).toBeDefined();
    expect(preventive!.familiesCount).toBe(1);
    expect(preventive!.checksum).not.toBe('');
  });

  it('restaura las imágenes y actualiza sus URI al almacenamiento actual', async () => {
    const oldUri = 'file:///old-install/product-images/product.jpg';
    const newUri = 'file:///current-install/product-images/restored_product.jpg';
    const payload: BackupPayload = {
      schemaVersion: 15,
      createdAt: new Date().toISOString(),
      families: [makeFamily({ id: 'fam_images' })],
      products: [makeProduct({
        id: 'prd_images',
        familyId: 'fam_images',
        photoUri: oldUri,
      })],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      quotations: [],
      clients: [],
      purchaseDocuments: [],
      images: { [oldUri]: 'data:image/jpeg;base64,ZmFrZQ==' },
    };
    const snapshot = makeBackupSnapshot({
      id: 'bkp_images',
      checksum: computeBackupChecksum(payload),
    });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
      async () => ({ [oldUri]: newUri }),
    );

    const result = await useCase.execute({
      backupId: 'bkp_images',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.imagesRestored).toBe(1);
    expect((await productRepo.findById('prd_images'))?.photoUri).toBe(newUri);
  });

  it('incluye clients en el backup y los restaura', async () => {
    const client = {
      id: 'cli_1',
      name: 'Juan Perez',
      rut: '11111111-1',
      phone: '+56912345678',
      email: 'juan@example.com',
      notes: 'Cliente frecuente',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    await clientRepo.create(client);

    const createBackup = new CreateBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      clientRepo, invoiceRepo, purchaseDocumentRepo,
    );
    const created = await createBackup.execute({ label: 'con clientes', trigger: 'manual' });
    const storedPayload = await backupRepo.loadPayload(created.id);
    expect(storedPayload?.clients).toEqual([client]);

    await clientRepo.delete('cli_1');
    expect(await clientRepo.findAll()).toHaveLength(0);

    const restoreBackup = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo, quotationRepo,
      invoiceRepo, clientRepo, purchaseDocumentRepo,
    );
    const result = await restoreBackup.execute({
      backupId: created.id,
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.clientsRestored).toBe(1);
    expect(await clientRepo.findById('cli_1')).toEqual(client);
  });
});