import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BackupSnapshot } from '../../domain/entities/BackupSnapshot';

export function useBackupManager() {
  const { useCases, autoBackupService } = useDependencies();
  const [backups, setBackups] = useState<BackupSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

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
    try {
      await useCases.createBackup.execute({ label, trigger: 'manual' });
      await loadBackups();
    } finally {
      setCreating(false);
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
            try {
              const result = await useCases.restoreBackup.execute({
                backupId: snapshot.id,
                confirmRestore: true,
              });
              Alert.alert(
                'Backup restaurado',
                `Se restauraron ${result.familiesRestored} familias, ${result.productsRestored} productos y ${result.catalogsRestored} catálogos.`,
              );
              await loadBackups();
            } finally {
              setRestoring(null);
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
            await useCases.restoreBackup['backupRepo'].delete(snapshot.id);
            await loadBackups();
          },
        },
      ],
    );
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
    toggleAutoBackup,
    reload: loadBackups,
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
