import { useState } from 'react';
import { Alert, Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
import * as DocumentPicker from 'expo-document-picker';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import {
  AppText,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyStateIllustrated,
  Header,
  Input,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Section,
  ProgressBar,
  Badge,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { BackupSnapshot } from '../../domain/entities/BackupSnapshot';
import { useBackupManager } from '../hooks/useBackupManager';
import { formatFileSize } from '../../../../shared/utils/money';

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual',
  'auto-before-delete': 'Auto (pre-eliminación)',
  'auto-periodic': 'Auto (periódico)',
  'auto-before-seed': 'Auto (pre-seed)',
};

export function BackupSettingsScreen() {
  const colors = useThemeColors();
  const { navigate } = useAppNavigation();
  const {
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
    createProgress,
    restoreProgress,
    importProgress,
    verifyingChecksum,
    checksumResults,
    lastImportPreview,
  } = useBackupManager();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<BackupSnapshot | null>(null);
  const [importPreview, setImportPreview] = useState<{
    families: number;
    products: number;
    catalogs: number;
    orders: number;
    suppliers: number;
    images: number;
  } | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);
  const [exportCustomName, setExportCustomName] = useState('');

  async function handleCreateBackup() {
    const label = backupLabel.trim() || `Backup manual - ${new Date().toLocaleString('es-CL')}`;
    await createManualBackup(label);
    setBackupLabel('');
    setShowCreateForm(false);
  }

  async function handleImportBackup() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;

      // Preview import first
      try {
        const preview = await previewImport(fileUri);
        setImportPreview(preview);
        setPendingImportUri(fileUri);
        setShowImportPreview(true);
      } catch (err) {
        Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo previsualizar el backup.');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo abrir el archivo.');
    }
  }

  async function confirmImport() {
    if (!pendingImportUri) return;
    try {
      await importBackup(pendingImportUri);
      Alert.alert('Backup importado', 'Datos restaurados exitosamente.');
      setShowImportPreview(false);
      setImportPreview(null);
      setPendingImportUri(null);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo importar el backup.');
    }
  }

  function formatBackupDate(iso: string): string {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getChecksumStatus(backupId: string) {
    const result = checksumResults[backupId];
    if (!result) return null;
    return result.valid ? 'success' : 'error';
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Configuración"
          title="Backup"
          subtitle="Protege tus datos con copias de seguridad automáticas."
        />

        {/* Backup Version Badge */}
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.versionBadge}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color="primary" style={{ fontWeight: '600' as any }}>
                Esquema de backup v1.0
              </AppText>
              <AppText variant="caption" color="muted">
                Compatible con CatalogClean 3.2+
              </AppText>
            </View>
            <Badge variant="success" size="small">Actualizado</Badge>
          </View>
        </Card>

        <Card>
          <CardHeader
            title="Backup automático"
            subtitle="Crea snapshots cuando detecta cambios importantes"
          />
          <Pressable
            onPress={toggleAutoBackup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons
                name={autoBackupEnabled ? 'shield-checkmark-outline' : 'shield-outline'}
                size={22}
                color={autoBackupEnabled ? colors.success : colors.textMuted}
              />
              <View>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' as any }}>
                  {autoBackupEnabled ? 'Activado' : 'Desactivado'}
                </AppText>
                <AppText variant="bodySmall" color="secondary">
                  {autoBackupEnabled
                    ? 'Se crean backups al iniciar sesión y periódicamente'
                    : 'No se crearán backups automáticos'}
                </AppText>
              </View>
            </View>
            <View
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: autoBackupEnabled ? colors.success : colors.textDisabled,
                padding: 3,
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: colors.textInverse,
                  alignSelf: autoBackupEnabled ? 'flex-end' : 'flex-start',
                }}
              />
            </View>
          </Pressable>
        </Card>

        {/* Progress bars */}
        {creating && createProgress !== null && (
          <Card style={{ marginTop: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" color="primary" style={{ marginBottom: 4 }}>
                  Creando backup... {createProgress}%
                </AppText>
                <ProgressBar progress={createProgress / 100} color={colors.primary} height={6} />
              </View>
            </View>
          </Card>
        )}

        {restoring && restoreProgress !== null && (
          <Card style={{ marginTop: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="cloud-download-outline" size={22} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" color="primary" style={{ marginBottom: 4 }}>
                  Restaurando... {restoreProgress}%
                </AppText>
                <ProgressBar progress={restoreProgress / 100} color={colors.warning} height={6} />
              </View>
            </View>
          </Card>
        )}

        {importProgress !== null && (
          <Card style={{ marginTop: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="document-text-outline" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall" color="primary" style={{ marginBottom: 4 }}>
                  Importando... {importProgress}%
                </AppText>
                <ProgressBar progress={importProgress / 100} color={colors.success} height={6} />
              </View>
            </View>
          </Card>
        )}

        <PrimaryButton
          label={creating ? 'Creando backup...' : 'Crear backup manual'}
          icon="add-circle-outline"
          disabled={creating}
          onPress={() => setShowCreateForm(true)}
        />

        <PrimaryButton
          label={importProgress !== null ? 'Importando...' : 'Importar backup desde archivo'}
          icon="document-outline"
          disabled={importProgress !== null}
          onPress={handleImportBackup}
        />

        <Section
          title={`Backups (${backups.length})`}
          action={
            backups.length > 0 ? (
              <AppText variant="caption" color="muted">Máx. 10</AppText>
            ) : undefined
          }
        >
          {loading ? (
            <Card>
              <View style={{ padding: 20, alignItems: 'center' }}>
                <AppText variant="bodySmall" color="muted">Cargando backups...</AppText>
              </View>
            </Card>
          ) : backups.length === 0 ? (
            <EmptyStateIllustrated
              icon="shield-outline"
              title="Sin backups"
              subtitle="Crea tu primer backup para proteger tus datos."
            />
          ) : (
            backups.map((backup) => {
              const checksumStatus = getChecksumStatus(backup.id);
              return (
                <Pressable
                  key={backup.id}
                  onPress={() => setSelectedBackup(backup)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
                >
                  <Card
                    variant={restoring === backup.id ? 'selected' : 'default'}
                    style={{ marginBottom: 8 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor:
                            backup.trigger === 'manual'
                              ? colors.primaryLight
                              : backup.trigger === 'auto-before-delete'
                                ? colors.warning + '20'
                                : colors.successLight,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons
                          name={
                            backup.trigger === 'manual'
                              ? 'finger-print-outline'
                              : backup.trigger === 'auto-before-delete'
                                ? 'warning-outline'
                                : 'time-outline'
                          }
                          size={20}
                          color={
                            backup.trigger === 'manual'
                              ? colors.primary
                              : backup.trigger === 'auto-before-delete'
                                ? colors.warning
                                : colors.success
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyMedium" color="primary" numberOfLines={1}>
                          {backup.label}
                        </AppText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <AppText variant="caption" color="muted">
                            {formatBackupDate(backup.createdAt)}
                          </AppText>
                          <AppText variant="caption" color="muted">·</AppText>
                          <AppText variant="caption" color="muted">
                            {backup.familiesCount} fam. · {backup.productsCount} prod.
                          </AppText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <AppText variant="caption" color="muted">
                            {TRIGGER_LABELS[backup.trigger] ?? backup.trigger}
                          </AppText>
                          {checksumStatus && (
                            <>
                              <AppText variant="caption" color="muted">·</AppText>
                              <Badge
                                variant={checksumStatus === 'success' ? 'success' : 'error'}
                                size="small"
                              >
                                {checksumStatus === 'success' ? 'Checksum OK' : 'Checksum Inválido'}
                              </Badge>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Pressable
                          onPress={() => exportBackup(backup, exportCustomName || undefined)}
                          style={[
                            {
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: colors.primaryLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}
                        >
                          <Ionicons name="share-outline" size={16} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => verifyChecksum(backup)}
                          disabled={verifyingChecksum === backup.id}
                          style={[
                            {
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: verifyingChecksum === backup.id ? colors.warning + '20' : colors.successLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}
                        >
                          {verifyingChecksum === backup.id ? (
                            <Ionicons name="refresh" size={16} color={colors.warning} />
                          ) : (
                            <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => restoreBackup(backup)}
                          disabled={restoring === backup.id}
                          style={[
                            {
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: colors.primaryLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}
                        >
                          <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => deleteBackup(backup)}
                          style={[
                            {
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              backgroundColor: colors.errorLight,
                              justifyContent: 'center',
                              alignItems: 'center',
                            },
                          ]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </Section>

        <SecondaryButton label="Volver a Configuración" icon="arrow-back-outline" onPress={() => navigate('Profile')} />
      </Screen>

      {showCreateForm && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Card variant="elevated" style={{ padding: 24 }}>
            <AppText variant="headingSmall" color="primary" style={{ marginBottom: 16 }}>
              Nuevo backup
            </AppText>
            <Input
              label="Etiqueta (opcional)"
              placeholder="Ej: Antes de actualizar"
              value={backupLabel}
              onChangeText={setBackupLabel}
            />
            <PrimaryButton
              label={creating ? 'Creando...' : 'Crear backup'}
              icon="save-outline"
              disabled={creating}
              onPress={handleCreateBackup}
            />
            <View style={{ height: 8 }} />
            <SecondaryButton
              label="Cancelar"
              onPress={() => {
                setShowCreateForm(false);
                setBackupLabel('');
              }}
            />
          </Card>
        </View>
      )}

      {showImportPreview && importPreview && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Card variant="elevated" style={{ padding: 24 }}>
            <AppText variant="headingSmall" color="primary" style={{ marginBottom: 16 }}>
              Vista previa de importación
            </AppText>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.families}</AppText>
              <AppText variant="bodySmall" color="muted">Familias</AppText>
            </View>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.products}</AppText>
              <AppText variant="bodySmall" color="muted">Productos</AppText>
            </View>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.catalogs}</AppText>
              <AppText variant="bodySmall" color="muted">Catálogos</AppText>
            </View>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.orders}</AppText>
              <AppText variant="bodySmall" color="muted">Pedidos</AppText>
            </View>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.suppliers}</AppText>
              <AppText variant="bodySmall" color="muted">Proveedores</AppText>
            </View>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.images}</AppText>
              <AppText variant="bodySmall" color="muted">Imágenes</AppText>
            </View>
            <View style={{ height: 16 }} />
            <AppText variant="caption" color="error" style={{ textAlign: 'center', marginBottom: 12 }}>
              ⚠ Esta acción reemplazará TODOS los datos actuales. No se puede deshacer.
            </AppText>
            <PrimaryButton
              label={importProgress !== null ? 'Importando...' : 'Confirmar importación'}
              icon="checkmark-outline"
              disabled={importProgress !== null}
              onPress={confirmImport}
            />
            <View style={{ height: 8 }} />
            <SecondaryButton
              label="Cancelar"
              onPress={() => {
                setShowImportPreview(false);
                setImportPreview(null);
                setPendingImportUri(null);
              }}
            />
          </Card>
        </View>
      )}

      <ConfirmDialog
        visible={selectedBackup !== null}
        title="Detalle del backup"
        message={
          selectedBackup
            ? `Etiqueta: ${selectedBackup.label}\n` +
              `Fecha: ${formatBackupDate(selectedBackup.createdAt)}\n` +
              `Familias: ${selectedBackup.familiesCount}\n` +
              `Productos: ${selectedBackup.productsCount}\n` +
              `Catálogos: ${selectedBackup.catalogsCount}\n` +
              `Pedidos: ${selectedBackup.ordersCount}\n` +
              `Proveedores: ${selectedBackup.suppliersCount}\n` +
              `Perfil: ${selectedBackup.hasProfile ? 'Sí' : 'No'}\n` +
              `Tipo: ${TRIGGER_LABELS[selectedBackup.trigger]}`
            : ''
        }
        confirmLabel="Restaurar"
        cancelLabel="Cerrar"
        onConfirm={() => {
          if (selectedBackup) restoreBackup(selectedBackup);
          setSelectedBackup(null);
        }}
        onCancel={() => setSelectedBackup(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
});
