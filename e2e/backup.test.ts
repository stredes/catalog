import { device, element, by, expect } from 'detox';

describe('Backup Settings Screen', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display backup version badge', async () => {
    await expect(element(by.id('backup-version-badge'))).toBeVisible();
    await expect(element(by.text('Esquema de backup v1.0'))).toBeVisible();
  });

  it('should show auto backup toggle', async () => {
    await expect(element(by.id('auto-backup-toggle'))).toBeVisible();
    await expect(element(by.text('Activado'))).toBeVisible();
  });

  it('should create manual backup with progress bar', async () => {
    await element(by.id('create-manual-backup-btn')).tap();
    await expect(element(by.id('backup-create-form'))).toBeVisible();
    
    await element(by.id('backup-label-input')).typeText('Test Backup E2E');
    await element(by.id('confirm-create-backup-btn')).tap();
    
    await expect(element(by.id('create-progress-bar'))).toBeVisible();
    await waitFor(element(by.id('create-progress-bar')))
      .toBeNotVisible()
      .withTimeout(30000);
    
    await expect(element(by.text('Test Backup E2E'))).toBeVisible();
  });

  it('should display backup list with counts', async () => {
    await expect(element(by.text('Backups (1)'))).toBeVisible();
    await expect(element(by.text('Test Backup E2E'))).toBeVisible();
    await expect(element(by.text('Manual'))).toBeVisible();
  });

  it('should verify checksum on backup', async () => {
    await element(by.id('verify-checksum-btn')).tap();
    await waitFor(element(by.text('Verificación exitosa')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('should show checksum badge on backup list', async () => {
    await expect(element(by.id('checksum-badge'))).toBeVisible();
    await expect(element(by.text('Checksum OK'))).toBeVisible();
  });

  it('should export backup with custom filename', async () => {
    await element(by.id('export-backup-btn')).tap();
    await expect(element(by.id('export-filename-input'))).toBeVisible();
    await element(by.id('export-filename-input')).typeText('my-custom-backup');
    await element(by.id('confirm-export-btn')).tap();
    
    await waitFor(element(by.text('Backup exportado')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('should preview import before confirming', async () => {
    await element(by.id('import-backup-btn')).tap();
    
    await expect(element(by.id('import-preview-modal'))).toBeVisible();
    await expect(element(by.text('Vista previa de importación'))).toBeVisible();
    await expect(element(by.text('Familias'))).toBeVisible();
    await expect(element(by.text('Productos'))).toBeVisible();
    await expect(element(by.text('Catálogos'))).toBeVisible();
    await expect(element(by.text('Pedidos'))).toBeVisible();
    await expect(element(by.text('Proveedores'))).toBeVisible();
    await expect(element(by.text('Imágenes'))).toBeVisible();
    await expect(element(by.text('⚠ Esta acción reemplazará TODOS los datos actuales. No se puede deshacer.'))).toBeVisible();
    
    await element(by.id('cancel-import-btn')).tap();
    await expect(element(by.id('import-preview-modal'))).toBeNotVisible();
  });

  it('should show restore progress bar', async () => {
    await element(by.id('restore-backup-btn')).tap();
    await waitFor(element(by.text('Restaurando...')))
      .toBeVisible()
      .withTimeout(15000);
    await waitFor(element(by.id('restore-progress-bar')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should delete backup', async () => {
    await element(by.id('delete-backup-btn')).tap();
    await expect(element(by.id('delete-confirm-dialog'))).toBeVisible();
    await element(by.text('Eliminar')).tap();
    await waitFor(element(by.text('Backup eliminado')))
      .toBeVisible()
      .withTimeout(10000);
  });
});

describe('Backup Auto-creation on App Start', () => {
  it('should create auto backup on fresh launch', async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await device.reloadReactNative();
    
    await element(by.id('backup-settings-tab')).tap();
    await expect(element(by.text('Auto (periódico)'))).toBeVisible();
  });
});