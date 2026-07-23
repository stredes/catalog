import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { BackupSnapshot } from '../../domain/entities/BackupSnapshot';
import { useBackupManager } from '../hooks/useBackupManager';
import { importBackupFromFile } from '../../infrastructure/services/FileImportService';

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
    toggleAutoBackup,
  } = useBackupManager();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<BackupSnapshot | null>(null);
  const [importing, setImporting] = useState(false);

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

      Alert.alert(
        'Importar backup',
        `Se reemplazaran TODOS los datos actuales con los del archivo:\n\n${fileName}\n\nEsta accion no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            style: 'destructive',
            onPress: async () => {
              setImporting(true);
              try {
                const counts = await importBackupFromFile(fileUri);
                Alert.alert(
                  'Backup importado',
                  `Restaurado exitosamente:\n• ${counts.families} familias\n• ${counts.products} productos\n• ${counts.catalogs} catálogos\n• ${counts.orders} pedidos\n• ${counts.images} imágenes`,
                );
              } catch (err) {
                Alert.alert(
                  'Error',
                  err instanceof Error ? err.message : 'No se pudo importar el backup. Verifica que el archivo sea válido.',
                );
              } finally {
                setImporting(false);
              }
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert('Error', 'No se pudo abrir el archivo.');
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

  return (
    <>
      <Screen>
        <Header
          eyebrow="Configuración"
          title="Backup"
          subtitle="Protege tus datos con copias de seguridad automáticas."
        />

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

        <PrimaryButton
          label={creating ? 'Creando backup...' : 'Crear backup manual'}
          icon="add-circle-outline"
          disabled={creating}
          onPress={() => setShowCreateForm(true)}
        />

        <PrimaryButton
          label={importing ? 'Importando...' : 'Importar backup desde archivo'}
          icon="document-outline"
          disabled={importing}
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
            backups.map((backup) => (
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
                      <AppText variant="caption" color="muted">
                        {TRIGGER_LABELS[backup.trigger] ?? backup.trigger}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <Pressable
                        onPress={() => shareBackup(backup)}
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
            ))
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
              label="Crear backup"
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
