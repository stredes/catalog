import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BackupSnapshot } from '../../domain/entities/BackupSnapshot';
import { computeChecksum } from '../../../../shared/utils/checksum';

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
    quotations: number;
    clients: number;
    images: number;
  } | null>(null);
  const importInFlightRef = useRef(false);
  const restoreInFlightRef = useRef(false);

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
    } catch (err) {
      Alert.alert(
        'No se pudo crear el backup',
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al crear el backup.',
      );
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
            if (restoreInFlightRef.current) return;
            restoreInFlightRef.current = true;
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
                createPreventiveBackup: false,
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
              restoreInFlightRef.current = false;
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

      const { createBackupArchive } = await import('../../infrastructure/services/BackupArchiveService');
      const archive = await createBackupArchive(payload, snapshot.label);

      await services.share.shareFile(archive.uri, `Backup: ${snapshot.label}`, 'application/zip');
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

      const { createBackupArchive } = await import('../../infrastructure/services/BackupArchiveService');
      const archive = await createBackupArchive(payload, customName || snapshot.label);

      await services.share.shareFile(archive.uri, `Backup: ${snapshot.label}`, 'application/zip');
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

      // Compute checksum with the same inputs used when the snapshot was created
      const computedChecksum = computeChecksum({
        fc: payload.families.length,
        pc: payload.products.length,
        cc: payload.catalogs.length,
        oc: payload.orders.length,
        sc: payload.suppliers?.length ?? 0,
        clc: payload.clients?.length ?? 0,
        fp: payload.profile !== null,
        fn: payload.families.map((f) => f.id).sort(),
        pn: payload.products.map((p) => p.id).sort(),
        cn: payload.catalogs.map((c) => c.id).sort(),
        cln: payload.clients?.map((c) => c.id).sort(),
      });

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
    if (importInFlightRef.current) {
      throw new Error('Ya hay una importación en curso. Espera a que termine.');
    }
    importInFlightRef.current = true;
    try {
      const { previewBackupFromFile } = await import('../../infrastructure/services/FileImportService');
      const preview = await previewBackupFromFile(fileUri);
      setLastImportPreview(preview);
      return preview;
    } finally {
      importInFlightRef.current = false;
    }
  }, []);

  const importBackup = useCallback(async (fileUri: string) => {
    if (importInFlightRef.current) {
      throw new Error('Ya hay una importación en curso. Espera a que termine.');
    }
    importInFlightRef.current = true;
    setImportProgress(0);
    try {
      const { importBackupFromFile } = await import('../../infrastructure/services/FileImportService');
      await importBackupFromFile(fileUri);
      await loadBackups();
      setImportProgress(100);
      return true;
    } finally {
      importInFlightRef.current = false;
      setImportProgress(null);
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
