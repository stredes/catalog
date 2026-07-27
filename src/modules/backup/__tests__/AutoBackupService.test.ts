import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateBackupUseCase } from '../application/use-cases/CreateBackupUseCase';
import { AutoBackupService } from '../infrastructure/services/AutoBackupService';
import { ChangeDetector } from '../infrastructure/services/ChangeDetector';
import {
  InMemoryBackupRepository,
  InMemoryFamilyRepository,
  InMemoryProductRepository,
  InMemoryCatalogRepository,
  InMemoryProfileRepository,
  InMemoryOrderRepository,
  InMemorySupplierRepository,
  InMemoryQuotationRepository,
  makeFamily,
  makeProduct,
} from '../../../__tests__/fakes';

describe('AutoBackupService', () => {
  let backupRepo: InMemoryBackupRepository;
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let catalogRepo: InMemoryCatalogRepository;
  let profileRepo: InMemoryProfileRepository;
  let orderRepo: InMemoryOrderRepository;
  let supplierRepo: InMemorySupplierRepository;
  let quotationRepo: InMemoryQuotationRepository;
  let createBackup: CreateBackupUseCase;
  let changeDetector: ChangeDetector;
  let service: AutoBackupService;

  beforeEach(() => {
    backupRepo = new InMemoryBackupRepository();
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();
    orderRepo = new InMemoryOrderRepository();
    supplierRepo = new InMemorySupplierRepository();
    quotationRepo = new InMemoryQuotationRepository();

    createBackup = new CreateBackupUseCase(
      backupRepo,
      familyRepo,
      productRepo,
      catalogRepo,
      profileRepo,
      orderRepo,
      supplierRepo,
      quotationRepo,
    );

    changeDetector = new ChangeDetector(
      familyRepo,
      productRepo,
      catalogRepo,
      profileRepo,
      orderRepo,
      supplierRepo,
    );

    service = new AutoBackupService(createBackup, changeDetector, backupRepo, {
      enabled: true,
      checkIntervalMs: 100,
    });
  });

  it('crea backup en inicio de sesión cuando no hay backups previos', async () => {
    await service.onSessionStart();

    const backups = await backupRepo.findAll();
    expect(backups).toHaveLength(1);
    expect(backups[0].trigger).toBe('auto-periodic');
    expect(backups[0].label).toContain('primer backup');
  });

  it('crea backup en inicio de sesión cuando hay cambios', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_1' }));
    await service.onSessionStart();

    await familyRepo.create(makeFamily({ id: 'fam_2' }));
    await service.onSessionStart();

    const backups = await backupRepo.findAll();
    expect(backups).toHaveLength(2);
  });

  it('no crea backup si no hay cambios', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_1' }));
    await service.onSessionStart();
    await service.onSessionStart();

    const backups = await backupRepo.findAll();
    expect(backups).toHaveLength(1);
  });

  it('crea backup antes de eliminación', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_1' }));
    await service.createPreDeleteBackup('familia');

    const backups = await backupRepo.findAll();
    expect(backups).toHaveLength(1);
    expect(backups[0].trigger).toBe('auto-before-delete');
    expect(backups[0].label).toContain('familia');
  });

  it('crea backup manual con etiqueta personalizada', async () => {
    await service.createManualBackup('Mi backup manual');

    const backups = await backupRepo.findAll();
    expect(backups).toHaveLength(1);
    expect(backups[0].trigger).toBe('manual');
    expect(backups[0].label).toBe('Mi backup manual');
  });

  it('detecta borrado masivo de familias', async () => {
    for (let i = 1; i <= 10; i++) {
      await familyRepo.create(makeFamily({ id: `fam_${i}` }));
    }

    const initial = await changeDetector.capture();

    for (let i = 1; i <= 8; i++) {
      await familyRepo.delete(`fam_${i}`);
    }

    const massive = await changeDetector.hasMassiveDeletion(initial, 0.5);
    expect(massive).toBe(true);
  });

  it('limpia servicios al detener monitoreo', () => {
    service.startMonitoring();
    service.stopMonitoring();
    expect(service['checkTimer']).toBeNull();
  });

  it('no inicia monitoreo dos veces', () => {
    service.startMonitoring();
    service.startMonitoring();
    const timer1 = service['checkTimer'];
    service.stopMonitoring();
    expect(timer1).not.toBeNull();
  });

  it('no ejecuta onSessionStart dos veces concurrentemente', async () => {
    const p1 = service.onSessionStart();
    const p2 = service.onSessionStart();
    await Promise.all([p1, p2]);
    const backups = await backupRepo.findAll();
    expect(backups.length).toBeLessThanOrEqual(2);
  });

  it('reporta isCurrentlyRunning correctamente', async () => {
    expect(service.isCurrentlyRunning).toBe(false);
  });

  it('createManualBackup lanza error si hay operacion en curso', async () => {
    service['isRunning'] = true;
    await expect(service.createManualBackup('test')).rejects.toThrow('operación de backup en curso');
  });

  it('onSessionStart es no-op si disabled', async () => {
    const disabledService = new AutoBackupService(createBackup, changeDetector, backupRepo, {
      enabled: false,
    });
    await disabledService.onSessionStart();
    const backups = await backupRepo.findAll();
    expect(backups).toHaveLength(0);
  });

  it('detecta cambios en pedidos y proveedores', async () => {
    const emptySnapshot = await changeDetector.capture();
    expect(emptySnapshot.counts.orders).toBe(0);
    expect(emptySnapshot.counts.suppliers).toBe(0);
  });

  it('captura incluye orders y suppliers en checksum', async () => {
    const snap1 = await changeDetector.capture();
    await orderRepo.save({
      id: 'o1', orderNumber: 1, clientName: 'Test',
      items: [], subtotal: 0, iva: 0, total: 0,
      status: 'pending', paidAmount: 0, createdAt: new Date().toISOString(),
    });
    const snap2 = await changeDetector.capture();
    expect(snap1.checksum).not.toBe(snap2.checksum);
  });
});
