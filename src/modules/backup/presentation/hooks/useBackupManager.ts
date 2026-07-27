import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BackupSnapshot } from '../../domain/entities/BackupSnapshot';
import { assertBackupIsComplete } from '../../infrastructure/services/BackupImageCollector';
import * as FileSystem from 'expo-file-system';

export function useBackupManager() {
  const { useCases, autoBackupService, services, repositories } = useDependencies();
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [createProgress, setCreateProgress] = useState<number | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<number | null>(null);
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [verifyingChecksum, setVerifyingChecksum] = useState<string | null>(null);
  const [checksumResults, setChecksumResults] = useState<Record<string, { valid: boolean; message: string }>>({});
  const [lastImportPreview, setLastImportPreview] = useState<{
    families: number;
    products: number;
    catalogs: number;
    orders: number;
    suppliers: number;
    images: number;
  } | null>(null);

  const loadBackups = useCallback(async () => {
    setLoading(true);
    const { backups: data } = await useCases.listBackups.execute({ limit: 50, offset: 0 });
    setBackups(data);
    setLoading(false);
  }, [useCases.listBackups]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const createManualBackup = useCallback(async (label: string) => {
    setCreating(true);
    setCreateProgress(0);
    try {
      await useCases.createBackup.execute({ label, trigger: 'manual' });
      // Simulate progress since the use case doesn't expose intermediate progress
      for (let i = 10; i <= 90; i += 20) {
        await new Promise((r) => setTimeout(r, 200));
        setCreateProgress(i);
      }
      await loadBackups();
      setCreateProgress(100);
      await new Promise((r) => setTimeout(r, 300));
    } finally {
      setCreating(false);
      setCreateProgress(null);
    }
  }, [useCases.createBackup, loadBackups]);

  const restoreBackup = useCallback(async (snapshot: BackupSnapshot) => {
    Alert.alert(
      'Restaurar backup',
      `Se restaurarán los datos del ${formatDate(snapshot.createdAt)}.\n\n` +
      `Familias: ${snapshot.familiesCount}\n` +
      `Productos: ${snapshot.productsCount}\n` +
      `Catálogos: ${snapshot.catalogsCount}\n\n` +
      'Los datos actuales se eliminarán. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            setRestoring(snapshot.id);
            setRestoreProgress(0);
            try {
              for (let i = 10; i <= 50; i += 10) {
                await new Promise((r) => setTimeout(r, 150));
                setRestoreProgress(i);
              }
              const result = await useCases.restoreBackup.execute({
                backupId: snapshot.id,
                confirmRestore: true,
              });
              for (let i = 60; i <= 90; i += 10) {
                await new Promise((r) => setTimeout(r, 150));
                setRestoreProgress(i);
              }
              Alert.alert(
                'Backup restaurado',
                `Se restauraron ${result.familiesRestored} familias, ${result.productsRestored} productos y ${result.catalogsRestored} catálogos.`,
              );
              await loadBackups();
              setRestoreProgress(100);
              await new Promise((r) => setTimeout(r, 300));
            } finally {
              setRestoring(null);
              setRestoreProgress(null);
            }
          },
        },
      ],
    );
  }, [useCases.restoreBackup, loadBackups]);

  const deleteBackup = useCallback(async (snapshot: BackupSnapshot) => {
    Alert.alert(
      'Eliminar backup',
      `¿Eliminar el backup "${snapshot.label}" del ${formatDate(snapshot.createdAt)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await repositories.backup.delete(snapshot.id);
            await loadBackups();
          },
        },
      ],
    );
  }, [loadBackups, repositories.backup]);

  const shareBackup = useCallback(async (snapshot: BackupSnapshot) => {
    try {
      const payload = await repositories.backup.loadPayload(snapshot.id);
      if (!payload) {
        Alert.alert('Error', 'No se pudo cargar el backup para compartir.');
        return;
      }

      assertBackupIsComplete(payload.products, payload.profile, payload.images);

      const safeLabel = snapshot.label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48) || 'completo';
      
      // Custom filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `CatalogClean_${safeLabel}_${timestamp}.json`;
      const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(tempUri, JSON.stringify(payload), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await services.share.shareFile(tempUri, `Backup: ${snapshot.label}`, 'application/json');
    } catch (err) {
      Alert.alert(
        'Error al compartir',
        err instanceof Error ? err.message : 'No se pudo compartir el backup.',
      );
    }
  }, [repositories.backup, services.share]);

  const exportBackup = useCallback(async (snapshot: BackupSnapshot, customName?: string) => {
    try {
      const payload = await repositories.backup.loadPayload(snapshot.id);
      if (!payload) {
        Alert.alert('Error', 'No se pudo cargar el backup para exportar.');
        return;
      }

      const safeLabel = customName || snapshot.label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48) || 'completo';
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `CatalogClean_${safeLabel}_${timestamp}.json`;
      const tempUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(tempUri, JSON.stringify(payload), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await services.share.shareFile(tempUri, `Backup: ${snapshot.label}`, 'application/json');
    } catch (err) {
      Alert.alert(
        'Error al exportar',
        err instanceof Error ? err.message : 'No se pudo exportar el backup.',
      );
    }
  }, [repositories.backup, services.share]);

  const verifyChecksum = useCallback(async (snapshot: BackupSnapshot) => {
    setVerifyingChecksum(snapshot.id);
    try {
      const payload = await repositories.backup.loadPayload(snapshot.id);
      if (!payload) {
        setChecksumResults((prev) => ({
          ...prev,
          [snapshot.id]: { valid: false, message: 'No se pudo cargar el payload' },
        }));
        return;
      }

      // Compute checksum from payload
      const crypto = await import('expo-crypto');
      const computedChecksum = await crypto.digestStringAsync(
        crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(payload),
      );

      const valid = computedChecksum === snapshot.checksum;
      setChecksumResults((prev) => ({
        ...prev,
        [snapshot.id]: {
          valid,
          message: valid
            ? 'Checksum válido: el backup está íntegro'
            : 'Checksum INVÁLIDO: el backup ha sido modificado o está corrupto',
        },
      }));

      Alert.alert(
        valid ? 'Verificación exitosa' : 'Checksum inválido',
        valid
          ? 'El backup está íntegro y no ha sido alterado.'
          : `El checksum no coincide.\nEsperado: ${snapshot.checksum.slice(0, 16)}...\nCalculado: ${computedChecksum.slice(0, 16)}...`,
      );
    } catch (err) {
      setChecksumResults((prev) => ({
        ...prev,
        [snapshot.id]: {
          valid: false,
          message: err instanceof Error ? err.message : 'Error al verificar checksum',
        },
      }));
      Alert.alert('Error', 'No se pudo verificar el checksum.');
    } finally {
      setVerifyingChecksum(null);
    }
  }, [repositories.backup]);

  const previewImport = useCallback(async (fileUri: string) => {
    setImportProgress(0);
    try {
      // We need to read the file and validate without importing
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setImportProgress(30);

      let raw: unknown;
      try {
        raw = JSON.parse(content);
      } catch {
        throw new Error('El archivo no es un backup válido (JSON inválido).');
      }
      setImportProgress(60);

      // Validate using the same validation as import
      const { validateBackupPayload } = await import('../../../../shared/validation/schemas');
      const currentBackup = validateBackupPayload(raw);
      
      if (currentBackup.success) {
        const payload = currentBackup.data;
        const preview = {
          families: payload.families.length,
          products: payload.products.length,
          catalogs: payload.catalogs.length,
          orders: payload.orders.length,
          suppliers: payload.suppliers.length,
          images: Object.keys(payload.images).length,
        };
        setImportProgress(100);
        setLastImportPreview(preview);
        return preview;
      }

      // Legacy format - estimate counts
      const data = raw as Record<string, unknown>;
      const preview = {
        families: (data.families as unknown[] | undefined)?.length ?? 0,
        products: (data.products as unknown[] | undefined)?.length ?? 0,
        catalogs: (data.catalogs as unknown[] | undefined)?.length ?? 0,
        orders: (data.orders as unknown[] | undefined)?.length ?? 0,
        suppliers: (data.suppliers as unknown[] | undefined)?.length ?? 0,
        images: (data.images as Record<string, string> | undefined) ? Object.keys(data.images).length : 0,
      };
      setImportProgress(100);
      setLastImportPreview(preview);
      return preview;
    } catch (err) {
      setImportProgress(null);
      throw err;
    }
  }, []);

  const importBackup = useCallback(async (fileUri: string) => {
    setImportProgress(0);
    try {
      const { importBackupFromFile } = await import('../../infrastructure/services/FileImportService');
      await importBackupFromFile(fileUri);
      setImportProgress(100);
      await loadBackups();
      return true;
    } catch (err) {
      setImportProgress(null);
      throw err;
    }
  }, [loadBackups]);

  const toggleAutoBackup = useCallback(() => {
    setAutoBackupEnabled((prev) => !prev);
    if (autoBackupEnabled) {
      autoBackupService.stopMonitoring();
    } else {
      autoBackupService.startMonitoring();
    }
  }, [autoBackupEnabled, autoBackupService]);

  return {
    backups,
    loading,
    creating,
    restoring,
    autoBackupEnabled,
    createManualBackup,
    restoreBackup,
    deleteBackup,
    shareBackup,
    exportBackup,
    verifyChecksum,
    previewImport,
    importBackup,
    toggleAutoBackup,
    reload: loadBackups,
    createProgress,
    restoreProgress,
    importProgress,
    verifyingChecksum,
    checksumResults,
    lastImportPreview,
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
