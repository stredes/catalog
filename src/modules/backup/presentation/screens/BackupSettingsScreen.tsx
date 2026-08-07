import { useState } from 'react';
import { Alert, Pressable, View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
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

function BackupActionButton({
  icon,
  label,
  onPress,
  disabled,
  busy,
  testID,
  accessibilityLabel,
  backgroundColor,
  borderColor,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  testID: string;
  accessibilityLabel: string;
  backgroundColor: string;
  borderColor: string;
  iconColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy: Boolean(busy) }}
      style={({ pressed }) => [
        styles.actionPill,
        {
          backgroundColor,
          borderColor,
          opacity: disabled || busy ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={iconColor} />
      <AppText variant="caption" color="secondary" style={{ color: iconColor }}>
        {label}
      </AppText>
    </Pressable>
  );
}

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
    quotations: number;
    clients: number;
    images: number;
  } | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [pendingImportUri, setPendingImportUri] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
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
        type: ['application/json', 'application/zip', 'application/x-zip-compressed'],
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
        setImportError(null);
        setShowImportPreview(true);
      } catch (err) {
        const detail =
          err instanceof Error
            ? `[PREVIEW]\n${err.message}\n\nSTACK:\n${err.stack ?? 'sin stack'}`
            : `[PREVIEW]\n${String(err)}`;
        console.error('[importBackup] PREVIEW FAILED', err);
        setImportError(detail);
        setShowImportPreview(true);
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
      setImportError(null);
    } catch (err) {
      const detail =
        err instanceof Error
          ? `[IMPORT]\n${err.message}\n\nSTACK:\n${err.stack ?? 'sin stack'}`
          : `[IMPORT]\n${String(err)}`;
      console.error('[importBackup] IMPORT FAILED', err);
      setImportError(detail);
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

  function extractStep(message: string): string | null {
    const matches = message.match(/\[[A-Z0-9-]+\]/g);
    if (!matches || matches.length === 0) return null;
    return matches[matches.length - 1].replace(/[\[\]]/g, '');
  }

  async function exportDiagnostic() {
    try {
      if (!importError) return;
      const dir = new Directory(Paths.document, 'diagnostico');
      dir.create({ idempotent: true, intermediates: true });
      const filename = `diagnostico-import-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      const file = new File(dir, filename);
      file.create({ overwrite: true, intermediates: true });
      file.write(`${importError}\n\nAPP_VERSION: 3.3.16\n`);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('Diagnóstico guardado', `Archivo: ${file.uri}`);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el diagnóstico.');
    }
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
        <Card style={{ marginBottom: 12 }} testID="backup-version-badge">
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
            <Badge color={colors.success}>Actualizado</Badge>
          </View>
        </Card>

        <Card>
          <CardHeader
            title="Backup automático"
            subtitle="Crea snapshots cuando detecta cambios importantes"
          />
          <Pressable
            onPress={toggleAutoBackup}
            testID="auto-backup-toggle"
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
          <Card style={{ marginTop: 12, marginBottom: 8 }} testID="create-progress-bar">
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
          <Card style={{ marginTop: 12, marginBottom: 8 }} testID="restore-progress-bar">
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
          <Card style={{ marginTop: 12, marginBottom: 8 }} testID="import-progress-bar">
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

        <View style={{ gap: 12 }}>
          <PrimaryButton
            label={creating ? 'Creando backup...' : 'Crear backup manual'}
            icon="add-circle-outline"
            disabled={creating}
            testID="create-manual-backup-btn"
            onPress={() => setShowCreateForm(true)}
          />

          <PrimaryButton
            label={importProgress !== null ? 'Importando...' : 'Importar backup desde archivo'}
            icon="document-outline"
            disabled={importProgress !== null}
            testID="import-backup-btn"
            onPress={handleImportBackup}
          />
        </View>

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
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
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
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="bodyMedium" color="primary">
                          {backup.label}
                        </AppText>
                        <View style={styles.backupMetaRow}>
                          <AppText variant="caption" color="muted">
                            {formatBackupDate(backup.createdAt)}
                          </AppText>
                          <AppText variant="caption" color="muted">·</AppText>
                          <AppText variant="caption" color="muted">
                            {backup.familiesCount} fam. · {backup.productsCount} prod.
                          </AppText>
                        </View>
                        <View style={styles.backupMetaRow}>
                          <AppText variant="caption" color="muted">
                            {TRIGGER_LABELS[backup.trigger] ?? backup.trigger}
                          </AppText>
                          {checksumStatus && (
                            <>
                              <AppText variant="caption" color="muted">·</AppText>
                              <Badge
                                color={checksumStatus === 'success' ? colors.success : colors.error}
                                testID="checksum-badge"
                              >
                                {checksumStatus === 'success' ? 'Checksum OK' : 'Checksum Inválido'}
                              </Badge>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.backupActions}>
                      <BackupActionButton
                        icon="share-outline"
                        label="Exportar"
                        onPress={() => exportBackup(backup, exportCustomName || undefined)}
                        disabled={creating || restoring !== null}
                        testID="export-backup-btn"
                        accessibilityLabel={`Exportar backup ${backup.label}`}
                        backgroundColor={colors.primaryLight}
                        borderColor={colors.primary + '30'}
                        iconColor={colors.primary}
                      />
                      <BackupActionButton
                        icon={verifyingChecksum === backup.id ? 'refresh' : 'shield-checkmark-outline'}
                        label="Verificar"
                        onPress={() => verifyChecksum(backup)}
                        disabled={verifyingChecksum === backup.id || restoring !== null}
                        busy={verifyingChecksum === backup.id}
                        testID="verify-checksum-btn"
                        accessibilityLabel={`Verificar checksum de ${backup.label}`}
                        backgroundColor={
                          verifyingChecksum === backup.id ? colors.warning + '20' : colors.successLight
                        }
                        borderColor={
                          verifyingChecksum === backup.id ? colors.warning + '40' : colors.success + '30'
                        }
                        iconColor={verifyingChecksum === backup.id ? colors.warning : colors.success}
                      />
                      <BackupActionButton
                        icon="refresh-outline"
                        label="Restaurar"
                        onPress={() => restoreBackup(backup)}
                        disabled={restoring === backup.id || creating}
                        testID="restore-backup-btn"
                        accessibilityLabel={`Restaurar backup ${backup.label}`}
                        backgroundColor={colors.primaryLight}
                        borderColor={colors.primary + '30'}
                        iconColor={colors.primary}
                      />
                      <BackupActionButton
                        icon="trash-outline"
                        label="Eliminar"
                        onPress={() => deleteBackup(backup)}
                        disabled={restoring !== null}
                        testID="delete-backup-btn"
                        accessibilityLabel={`Eliminar backup ${backup.label}`}
                        backgroundColor={colors.errorLight}
                        borderColor={colors.error + '30'}
                        iconColor={colors.error}
                      />
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
          testID="backup-create-form"
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
              testID="backup-label-input"
            />
            <PrimaryButton
              label={creating ? 'Creando...' : 'Crear backup'}
              icon="save-outline"
              disabled={creating}
              testID="confirm-create-backup-btn"
              onPress={handleCreateBackup}
            />
            <View style={{ height: 8 }} />
            <SecondaryButton
              label="Cancelar"
              testID="cancel-create-backup-btn"
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
          testID="import-preview-modal"
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
          <Card variant="elevated" style={{ padding: 24, maxHeight: '90%' }}>
            <AppText variant="headingSmall" color="primary" style={{ marginBottom: 16 }}>
              {importError ? 'Error de importación' : 'Vista previa de importación'}
            </AppText>
            {importError ? (
              <>
                {(() => {
                  const step = extractStep(importError);
                  return step ? (
                    <AppText
                      variant="headingSmall"
                      color="error"
                      style={{ fontWeight: '700' as any, marginBottom: 12 }}
                    >
                      PASO: {step}
                    </AppText>
                  ) : null;
                })()}
                <ScrollView
                  style={{ maxHeight: 340 }}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                  <AppText variant="caption" color="error" style={{ fontFamily: 'monospace' }}>
                    {importError}
                  </AppText>
                </ScrollView>
                <View style={{ height: 16 }} />
                <PrimaryButton
                  label="Exportar diagnóstico"
                  icon="share-outline"
                  testID="export-diagnostic-btn"
                  onPress={exportDiagnostic}
                />
                <View style={{ height: 8 }} />
                <SecondaryButton
                  label="Cerrar"
                  testID="close-import-error-btn"
                  onPress={() => {
                    setImportError(null);
                    setShowImportPreview(false);
                    setImportPreview(null);
                    setPendingImportUri(null);
                  }}
                />
              </>
            ) : (
            <>
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
              <AppText variant="bodyMedium" color="primary">{importPreview.quotations}</AppText>
              <AppText variant="bodySmall" color="muted">Cotizaciones</AppText>
            </View>
            <View style={styles.previewItem}>
              <AppText variant="bodyMedium" color="primary">{importPreview.clients}</AppText>
              <AppText variant="bodySmall" color="muted">Clientes</AppText>
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
              testID="confirm-import-btn"
              onPress={confirmImport}
            />
            <View style={{ height: 8 }} />
            <SecondaryButton
              label="Cancelar"
              testID="cancel-import-btn"
              onPress={() => {
                setShowImportPreview(false);
                setImportPreview(null);
                setPendingImportUri(null);
              }}
            />
            </>
            )}
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
  backupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  backupActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
});
