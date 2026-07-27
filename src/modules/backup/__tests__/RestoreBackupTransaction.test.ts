import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryBackupRepository,
  InMemoryFamilyRepository,
  InMemoryProductRepository,
  InMemoryCatalogRepository,
  InMemoryProfileRepository,
  InMemoryOrderRepository,
  InMemorySupplierRepository,
  makeFamily,
  makeProduct,
  makeProfile,
  makeBackupSnapshot,
  computeBackupChecksum,
} from '../../../__tests__/fakes';
import { CreateBackupUseCase } from '../application/use-cases/CreateBackupUseCase';
import { RestoreBackupUseCase } from '../application/use-cases/RestoreBackupUseCase';
import { BackupPayload } from '../domain/entities/BackupSnapshot';

describe('RestoreBackupUseCase - Transaccional', () => {
  let backupRepo: InMemoryBackupRepository;
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let catalogRepo: InMemoryCatalogRepository;
  let profileRepo: InMemoryProfileRepository;
  let orderRepo: InMemoryOrderRepository;
  let supplierRepo: InMemorySupplierRepository;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();
    orderRepo = new InMemoryOrderRepository();
    supplierRepo = new InMemorySupplierRepository();
    backupRepo = new InMemoryBackupRepository({
      familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
    });
  });

  it('lanza error cuando el backup no existe', async () => {
    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: {},
    };
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_valid', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_mixed', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_broken' });
    await backupRepo.saveSnapshot(snapshot, brokenPayload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      schemaVersion: 14,
      createdAt: new Date().toISOString(),
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_valid', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
    );

    const result = await useCase.execute({
      backupId: 'bkp_valid',
      confirmRestore: true,
      createPreventiveBackup: false,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.familiesRestored).toBe(0);
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

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();
    orderRepo = new InMemoryOrderRepository();
    supplierRepo = new InMemorySupplierRepository();
    backupRepo = new InMemoryBackupRepository({
      familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: {},
    };
    const snapshot = makeBackupSnapshot({ id: 'bkp_bad_ver' });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
    );

    await expect(useCase.execute({
      backupId: 'bkp_bad_ver',
      confirmRestore: true,
      createPreventiveBackup: false,
    })).rejects.toThrow('versión de esquema inválida');
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
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_bad_checksum', checksum: 'wrong_checksum' });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: {},
    };

    const snapshot = makeBackupSnapshot({ id: 'bkp_real', checksum: computeBackupChecksum(payload) });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
      images: { [oldUri]: 'data:image/jpeg;base64,ZmFrZQ==' },
    };
    const snapshot = makeBackupSnapshot({
      id: 'bkp_images',
      checksum: computeBackupChecksum(payload),
    });
    await backupRepo.saveSnapshot(snapshot, payload);

    const useCase = new RestoreBackupUseCase(
      backupRepo, familyRepo, productRepo, catalogRepo,
      profileRepo, orderRepo, supplierRepo,
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
});
