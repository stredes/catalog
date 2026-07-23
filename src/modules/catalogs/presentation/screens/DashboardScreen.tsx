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
import { useOrders } from '../../../orders/presentation/hooks/useOrders';
import { useCart } from '../../../orders/presentation/hooks/useCart';

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
  const { orders } = useOrders();
  const { totalItems } = useCart();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [seeding, setSeeding] = useState(false);

  const inventoryValue = useMemo(
    () => products.reduce((total, product) => total + product.price * product.stock, 0),
    [products],
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending'),
    [orders],
  );
  const pendingTotal = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + o.total, 0),
    [pendingOrders],
  );

  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === 'paid'),
    [orders],
  );
  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + o.total, 0),
    [paidOrders],
  );
  const totalCollected = useMemo(
    () => orders.reduce((sum, o) => sum + (o.paidAmount ?? 0), 0),
    [orders],
  );
  const totalPending = useMemo(
    () => orders.reduce((sum, o) => sum + Math.max(0, o.total - (o.paidAmount ?? 0)), 0),
    [orders],
  );
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = map.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          map.set(item.productId, { name: item.productName, qty: item.quantity, revenue: item.subtotal });
        }
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const recentCatalogs = useMemo(() => [...catalogs].reverse().slice(0, 3), [catalogs]);
  const businessName = profile?.businessName?.trim() || 'Catalog Clean';

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
          <QuickTile
            icon="cube-outline"
            label="Productos"
            onPress={() => navigate('Products')}
            accent={colors.primary}
          />
          <QuickTile
            icon="cart-outline"
            label="Carrito"
            onPress={() => navigate('Cart')}
            accent={colors.info}
            badge={totalItems > 0 ? totalItems : undefined}
          />
          <QuickTile
            icon="receipt-outline"
            label="Pedidos"
            onPress={() => navigate('OrderHistory')}
            accent={colors.success}
            badge={pendingOrders.length > 0 ? pendingOrders.length : undefined}
            badgeColor={colors.warning}
          />
          <QuickTile
            icon="folder-outline"
            label="Categorias"
            onPress={() => navigate('Families')}
            accent={colors.secondary}
          />
          <QuickTile
            icon="business-outline"
            label="Proveedores"
            onPress={() => navigate('Suppliers')}
            accent="#8B5CF6"
          />
          <QuickTile
            icon="cart-outline"
            label="Compra proveedor"
            onPress={() => navigate('PurchaseCart')}
            accent={colors.warning}
          />
          <QuickTile
            icon="cloud-upload-outline"
            label="Backup"
            onPress={() => navigate('Backup')}
            accent={colors.info}
          />
        </View>

        {pendingOrders.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${pendingOrders.length} pedidos pendientes por cobrar`}
            onPress={() => navigate('OrderHistory')}
            style={({ pressed }) => [
              styles.pendingBanner,
              {
                backgroundColor: colors.warning + '12',
                borderColor: colors.warning + '30',
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.pendingIcon, { backgroundColor: colors.warning + '20' }]}>
              <Ionicons name="time-outline" size={22} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any }}>
                {pendingOrders.length} pedido{pendingOrders.length !== 1 ? 's' : ''} pendiente{pendingOrders.length !== 1 ? 's' : ''}
              </AppText>
              <AppText variant="caption" color="muted">
                Por cobrar: {formatMoney(pendingTotal)}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="heading3" color="primary">Estadisticas de ventas</AppText>
            <AppText variant="bodySmall" color="muted">Resumen acumulado de tus pedidos.</AppText>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Ventas pagadas" value={formatMoney(totalRevenue)} icon="trending-up-outline" accent={colors.success} />
          <MetricCard label="Total cobrado" value={formatMoney(totalCollected)} icon="wallet-outline" accent={colors.info} />
          <MetricCard label="Por cobrar" value={formatMoney(totalPending)} icon="hourglass-outline" accent={colors.warning} />
          <MetricCard label="Pedidos" value={String(orders.length)} icon="receipt-outline" accent={colors.primary} />
        </View>

        {topProducts.length > 0 ? (
          <Card style={styles.salesCard}>
            <AppText variant="title" color="primary">Productos mas vendidos</AppText>
            {topProducts.map((product, index) => (
              <View key={`${product.name}-${index}`} style={styles.salesRow}>
                <View style={[styles.salesRank, { backgroundColor: colors.primarySoft }]}>
                  <AppText variant="caption" color="accent" style={{ fontWeight: '700' as any }}>
                    {index + 1}
                  </AppText>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText variant="bodySmall" color="primary" numberOfLines={1}>{product.name}</AppText>
                  <AppText variant="caption" color="muted">{product.qty} unidades</AppText>
                </View>
                <AppText variant="bodySmall" color="primary" style={{ fontWeight: '700' as any }}>
                  {formatMoney(product.revenue)}
                </AppText>
              </View>
            ))}
          </Card>
        ) : null}

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

function QuickTile({ icon, label, onPress, accent, badge, badgeColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  accent?: string;
  badge?: number;
  badgeColor?: string;
}) {
  const colors = useThemeColors();
  const tileColor = accent ?? colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} notificaciones` : label}
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
      <View style={[styles.quickIcon, { backgroundColor: tileColor + '18' }]}>
        <Ionicons name={icon} size={22} color={tileColor} />
        {badge !== undefined && badge > 0 ? (
          <View style={[styles.quickBadge, { backgroundColor: badgeColor ?? colors.error }]}>
            <AppText variant="caption" color="inverse" style={{ fontSize: 10, fontWeight: '700' as any }}>
              {badge > 99 ? '99+' : badge}
            </AppText>
          </View>
        ) : null}
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
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 96,
    padding: spacing.md,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 44,
  },
  quickBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickLabel: {
    textAlign: 'center',
    fontSize: 12,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1,
  },
  pendingIcon: {
    alignItems: 'center',
    borderRadius: borderRadius.medium,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  salesCard: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  salesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  salesRank: {
    alignItems: 'center',
    borderRadius: borderRadius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
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
