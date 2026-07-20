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
  makeFamily,
  makeProduct,
} from '../../../__tests__/fakes';

describe('AutoBackupService', () => {
  let backupRepo: InMemoryBackupRepository;
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let catalogRepo: InMemoryCatalogRepository;
  let profileRepo: InMemoryProfileRepository;
  let createBackup: CreateBackupUseCase;
  let changeDetector: ChangeDetector;
  let service: AutoBackupService;

  beforeEach(() => {
    backupRepo = new InMemoryBackupRepository();
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();

    createBackup = new CreateBackupUseCase(
      backupRepo,
      familyRepo,
      productRepo,
      catalogRepo,
      profileRepo,
    );

    changeDetector = new ChangeDetector(
      familyRepo,
      productRepo,
      catalogRepo,
      profileRepo,
    );

    service = new AutoBackupService(createBackup, changeDetector, {
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
});
