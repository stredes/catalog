import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  FloatingActionButton,
  MetricCard,
  Screen,
  SecondaryButton,
  StatusBadge,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { borderRadius, shadows, spacing } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';
import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { useCatalogs } from '../hooks/useCatalogs';

const formatLabels: Record<string, string> = {
  'grid-2': 'Editorial 2 columnas',
  'grid-3': 'Grid comercial',
  'grid-4x5': 'Catalogo denso',
  'grid-3x7': 'Lista compacta',
  'simple-list': 'Lista simple',
  'premium-cover': 'Premium editorial',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function DashboardScreen() {
  const { navigate } = useAppNavigation();
  const { useCases } = useDependencies();
  const { products, loading: productsLoading } = useProducts();
  const { families, loading: familiesLoading } = useFamilies();
  const { catalogs } = useCatalogs();
  const { profile } = useProfile();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [seeding, setSeeding] = useState(false);

  const inventoryValue = useMemo(
    () => products.reduce((total, product) => total + product.price * product.stock, 0),
    [products],
  );

  const recentCatalogs = useMemo(() => [...catalogs].reverse().slice(0, 3), [catalogs]);
  const businessName = profile?.businessName?.trim() || 'Catalog Clean';
  const canShare = catalogs.length > 0;

  async function handleSeed() {
    const hasData = await useCases.seed.hasExistingData();

    if (hasData) {
      Alert.alert(
        'Reemplazar datos',
        'Ya existen categorias y productos. Se borraran los datos actuales y se cargaran datos de prueba.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reemplazar', style: 'destructive', onPress: () => executeSeed() },
        ],
      );
      return;
    }

    executeSeed();
  }

  async function executeSeed() {
    setSeeding(true);
    try {
      const result = await useCases.seed.execute();
      Alert.alert('Datos cargados', `Se insertaron ${result.families} categorias y ${result.products} productos.`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Ocurrió un error al cargar los datos.');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <Screen style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <AppText variant="overline" color="muted">{getGreeting()}</AppText>
            <AppText variant="display" color="primary" style={styles.heroTitle}>{businessName}</AppText>
            <AppText variant="bodyLarge" color="secondary" style={styles.heroSubtitle}>
              Tu proximo catalogo esta a un paso.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            onPress={() => navigate('Profile')}
            style={({ pressed }) => [
              styles.profileButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Card variant="elevated" style={styles.primaryAction}>
          <View style={styles.primaryActionHeader}>
            <View style={[styles.editorialMark, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="albums-outline" size={28} color={colors.primary} />
            </View>
            <StatusBadge label="PDF offline" tone="info" />
          </View>
          <AppText variant="heading1" color="primary" style={styles.actionTitle}>
            Crea un catalogo profesional
          </AppText>
          <AppText variant="bodyMedium" color="secondary" style={styles.actionCopy}>
            Selecciona productos, elige una plantilla y genera una pieza editorial lista para compartir.
          </AppText>
          <View style={styles.actionRow}>
            <Button
              label="Crear nuevo catalogo"
              icon="add-circle-outline"
              onPress={() => navigate('CatalogBuilder')}
              fullWidth
            />
          </View>
        </Card>

        <View style={styles.metricsGrid}>
          <MetricCard label="Productos" value={String(products.length)} icon="cube-outline" accent={colors.primary} />
          <MetricCard label="Categorias" value={String(families.length)} icon="folder-outline" accent={colors.info} />
          <MetricCard label="Catalogos" value={String(catalogs.length)} icon="document-text-outline" accent={colors.success} />
          <MetricCard label="Inventario" value={formatMoney(inventoryValue)} icon="cash-outline" accent={colors.warning} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="heading3" color="primary">Acciones rapidas</AppText>
            <AppText variant="bodySmall" color="muted">Gestiona lo esencial sin perder contexto.</AppText>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <QuickTile icon="cube-outline" label="Nuevo producto" onPress={() => navigate('Products')} />
          <QuickTile icon="folder-outline" label="Nueva categoria" onPress={() => navigate('Families')} />
          <QuickTile icon="document-text-outline" label="Historial" onPress={() => navigate('Catalogs')} />
          <QuickTile icon="receipt-outline" label="Pedidos" onPress={() => navigate('OrderHistory')} />
          <QuickTile icon="cart-outline" label="Compra proveedor" onPress={() => navigate('PurchaseDetail')} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="heading3" color="primary">Catalogos recientes</AppText>
            <AppText variant="bodySmall" color="muted">Tus ultimas publicaciones generadas.</AppText>
          </View>
          {recentCatalogs.length > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => navigate('Catalogs')}>
              <AppText variant="label" color="accent">Ver todos</AppText>
            </Pressable>
          ) : null}
        </View>

        {recentCatalogs.length > 0 ? (
          <View style={styles.catalogList}>
            {recentCatalogs.map((catalog) => (
              <Pressable
                key={catalog.id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir catalogo ${catalog.name}`}
                onPress={() => navigate('Catalogs')}
                style={({ pressed }) => [{ opacity: pressed ? 0.82 : 1 }]}
              >
                <Card style={styles.catalogCard}>
                  <View style={[styles.catalogCover, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
                    <View style={[styles.coverLine, { backgroundColor: colors.textPrimary }]} />
                    <View style={[styles.coverBlock, { backgroundColor: colors.borderStrong }]} />
                    <View style={[styles.coverLineSmall, { backgroundColor: colors.textMuted }]} />
                  </View>
                  <View style={styles.catalogInfo}>
                    <AppText variant="title" color="primary" numberOfLines={1}>{catalog.name}</AppText>
                    <AppText variant="bodySmall" color="muted" numberOfLines={1}>
                      {formatLabels[catalog.format] ?? catalog.format}
                    </AppText>
                    <View style={styles.catalogMeta}>
                      <AppText variant="caption" color="muted">{catalog.productIds.length} productos</AppText>
                      <AppText variant="caption" color="muted">{new Date(catalog.createdAt).toLocaleDateString('es-CL')}</AppText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="Aun no tienes catalogos"
            description="Crea tu primer catalogo cuando ya tengas productos cargados."
            actionLabel="Crear catalogo"
            onAction={() => navigate('CatalogBuilder')}
          />
        )}

        {products.length === 0 ? (
          <>
            <EmptyState
              icon="cube-outline"
              title="Agrega tu primer producto"
              description="Los productos son la base para crear catalogos profesionales."
              actionLabel="Crear producto"
              onAction={() => navigate('Products')}
            />
            {__DEV__ && !productsLoading && !familiesLoading ? (
              <SecondaryButton
                label={seeding ? 'Cargando...' : 'Cargar datos de prueba'}
                icon="flask-outline"
                onPress={handleSeed}
                disabled={seeding}
                fullWidth
              />
            ) : null}
          </>
        ) : null}
      </Screen>

      <FloatingActionButton
        icon="add"
        label="Catalogo"
        onPress={() => navigate('CatalogBuilder')}
        bottom={insets.bottom + 108}
      />
      <BottomMenu />
    </>
  );
}

function QuickTile({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickTile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <AppText variant="label" color="primary" style={styles.quickLabel}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  heroCopy: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  heroTitle: {
    marginTop: spacing.xs,
  },
  heroSubtitle: {
    marginTop: spacing.sm,
  },
  profileButton: {
    alignItems: 'center',
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  primaryAction: {
    padding: spacing.xxl,
  },
  primaryActionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  editorialMark: {
    alignItems: 'center',
    borderRadius: borderRadius.large,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  actionTitle: {
    maxWidth: 320,
  },
  actionCopy: {
    marginTop: spacing.sm,
  },
  actionRow: {
    marginTop: spacing.xl,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickTile: {
    ...shadows.sm,
    alignItems: 'center',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
    padding: spacing.lg,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 42,
  },
  quickLabel: {
    textAlign: 'center',
  },
  catalogList: {
    gap: spacing.md,
  },
  catalogCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  catalogCover: {
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    height: 76,
    justifyContent: 'space-between',
    padding: spacing.sm,
    width: 56,
  },
  coverLine: {
    borderRadius: 2,
    height: 5,
    width: '70%',
  },
  coverBlock: {
    borderRadius: 4,
    flex: 1,
    marginVertical: spacing.sm,
    width: '100%',
  },
  coverLineSmall: {
    borderRadius: 2,
    height: 4,
    width: '52%',
  },
  catalogInfo: {
    flex: 1,
  },
  catalogMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
