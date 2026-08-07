import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
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
import { borderRadius, motion, shadows, spacing } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';

import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { useCatalogs } from '../hooks/useCatalogs';
import { useOrders } from '../../../orders/presentation/hooks/useOrders';
import { useCart } from '../../../orders/presentation/hooks/useCart';
import { useInvoices } from '../../../invoices/presentation/hooks/useInvoices';

const FAB_HEIGHT = 48;
const FAB_BOTTOM_OFFSET = 108;
const BOTTOM_PADDING_MARGIN = 24;

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
  const { invoices } = useInvoices();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [seeding, setSeeding] = useState(false);

  const compactLayout = screenWidth < 390;
  const gridGap = 16;
  const useSingleColumn = screenWidth < 350;
  const availableWidth = screenWidth - 40;
  const cardWidth = useSingleColumn ? availableWidth : (availableWidth - gridGap) / 2;
  const contentBottomPadding =
    FAB_BOTTOM_OFFSET +
    FAB_HEIGHT +
    insets.bottom +
    BOTTOM_PADDING_MARGIN;

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
  const pendingInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'pending'),
    [invoices],
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
      <Screen style={styles.screen} contentBottomPadding={contentBottomPadding}>
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <AppText variant="overline" color="muted">{getGreeting()}</AppText>
              <AppText variant="display" color="primary" style={styles.heroTitle}>{businessName}</AppText>
              <AppText variant="bodyLarge" color="secondary" style={styles.heroSubtitle}>
                Tu proximo catalogo esta a un paso.
              </AppText>
            </View>
            <ProfileButton onPress={() => navigate('Profile')} colors={colors} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(450).springify()}>
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
        </Animated.View>

        <View style={[styles.metricsGrid, { gap: gridGap }]}>
          <Animated.View entering={FadeInRight.delay(200).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Productos" value={String(products.length)} icon="cube-outline" accent={colors.primary} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(250).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Categorias" value={String(families.length)} icon="folder-outline" accent={colors.info} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(300).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Catalogos" value={String(catalogs.length)} icon="document-text-outline" accent={colors.success} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(350).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Inventario" value={formatMoney(inventoryValue)} icon="cash-outline" accent={colors.warning} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(300).duration(300).springify()}>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="heading3" color="primary">Acciones rapidas</AppText>
              <AppText variant="bodySmall" color="muted">Gestiona lo esencial sin perder contexto.</AppText>
            </View>
          </View>
        </Animated.View>

        <View style={styles.quickGrid}>
          <Animated.View entering={FadeInDown.delay(400).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="cube-outline"
              label="Productos"
              onPress={() => navigate('Products')}
              accent={colors.primary}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(430).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="cart-outline"
              label="Carrito"
              onPress={() => navigate('Cart')}
              accent={colors.info}
              badge={totalItems > 0 ? totalItems : undefined}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(460).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="receipt-outline"
              label="Pedidos"
              onPress={() => navigate('OrderHistory')}
              accent={colors.success}
              badge={pendingOrders.length > 0 ? pendingOrders.length : undefined}
              badgeColor={colors.warning}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(490).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="folder-outline"
              label="Categorias"
              onPress={() => navigate('Families')}
              accent={colors.secondary}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(520).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="business-outline"
              label="Proveedores"
              onPress={() => navigate('Suppliers')}
              accent="#8B5CF6"
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(550).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="cart-outline"
              label="Compra proveedor"
              onPress={() => navigate('PurchaseCart')}
              accent={colors.warning}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(580).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="calculator-outline"
              label="Cotizaciones"
              onPress={() => navigate('QuotationBuilder')}
              accent="#8B5CF6"
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(610).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="document-text-outline"
              label="Facturas"
              onPress={() => navigate('Invoices')}
              accent="#0EA5E9"
              badge={pendingInvoices.length > 0 ? pendingInvoices.length : undefined}
              badgeColor={colors.warning}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(640).duration(350).springify()} style={{ width: '47%' }}>
            <QuickTile
              icon="cloud-upload-outline"
              label="Backup"
              onPress={() => navigate('Backup')}
              accent={colors.info}
            />
          </Animated.View>
        </View>

        {pendingOrders.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(500).duration(400).springify()}>
            <PendingBanner
              orderCount={pendingOrders.length}
              pendingTotal={pendingTotal}
              colors={colors}
              onPress={() => navigate('OrderHistory')}
            />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(450).duration(300).springify()}>
          <View style={styles.sectionHeader}>
            <View>
              <AppText variant="heading3" color="primary">Estadisticas de ventas</AppText>
              <AppText variant="bodySmall" color="muted">Resumen acumulado de tus pedidos.</AppText>
            </View>
          </View>
        </Animated.View>

        <View style={[styles.metricsGrid, { gap: gridGap }]}>
          <Animated.View entering={FadeInRight.delay(500).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Ventas pagadas" value={formatMoney(totalRevenue)} icon="trending-up-outline" accent={colors.success} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(550).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Total cobrado" value={formatMoney(totalCollected)} icon="wallet-outline" accent={colors.info} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(600).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Por cobrar" value={formatMoney(totalPending)} icon="hourglass-outline" accent={colors.warning} />
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(650).duration(400).springify()} style={{ width: cardWidth }}>
            <MetricCard label="Pedidos" value={String(orders.length)} icon="receipt-outline" accent={colors.primary} />
          </Animated.View>
        </View>

        {topProducts.length > 0 ? (
          <Animated.View entering={FadeInUp.delay(550).duration(450).springify()}>
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
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(600).duration(300).springify()}>
          <View style={[styles.sectionHeader, compactLayout && styles.sectionHeaderCompact]}>
            <View style={styles.sectionHeaderText}>
              <AppText variant="heading3" color="primary">Catalogos recientes</AppText>
              <AppText variant="bodySmall" color="muted">Tus ultimas publicaciones generadas.</AppText>
            </View>
            {recentCatalogs.length > 0 ? (
              <HeaderAction onPress={() => navigate('Catalogs')} colors={colors} />
            ) : null}
          </View>
        </Animated.View>

        {recentCatalogs.length > 0 ? (
          <View style={styles.catalogList}>
            {recentCatalogs.map((catalog, index) => (
              <Animated.View
                key={catalog.id}
                entering={FadeInDown.delay(650 + index * 80).duration(350).springify()}
              >
                <CatalogItem catalog={catalog} colors={colors} onPress={() => navigate('Catalogs')} />
              </Animated.View>
            ))}
          </View>
        ) : (
          <Animated.View entering={FadeInUp.delay(700).duration(400).springify()}>
            <EmptyState
              icon="document-text-outline"
              title="Aun no tienes catalogos"
              description="Crea tu primer catalogo cuando ya tengas productos cargados."
              actionLabel="Crear catalogo"
              onAction={() => navigate('CatalogBuilder')}
            />
          </Animated.View>
        )}

        {products.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(750).duration(400).springify()}>
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
          </Animated.View>
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

function useScalePress() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = useCallback(() => { scale.value = withSpring(motion.pressScale, { damping: motion.springDamping, stiffness: motion.springStiffness }); }, [scale]);
  const onPressOut = useCallback(() => { scale.value = withSpring(1, { damping: motion.springDamping, stiffness: motion.springStiffness }); }, [scale]);
  return { style, onPressIn, onPressOut };
}

function ProfileButton({ onPress, colors }: { onPress: () => void; colors: ReturnType<typeof useThemeColors> }) {
  const { style, onPressIn, onPressOut } = useScalePress();
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir perfil"
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.profileButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

function PendingBanner({ orderCount, pendingTotal, colors, onPress }: { orderCount: number; pendingTotal: number; colors: ReturnType<typeof useThemeColors>; onPress: () => void }) {
  const { style, onPressIn, onPressOut } = useScalePress();
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${orderCount} pedidos pendientes por cobrar`}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.pendingBanner,
          {
            backgroundColor: colors.warning + '12',
            borderColor: colors.warning + '30',
          },
        ]}
      >
        <View style={[styles.pendingIcon, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="time-outline" size={22} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any }}>
            {orderCount} pedido{orderCount !== 1 ? 's' : ''} pendiente{orderCount !== 1 ? 's' : ''}
          </AppText>
          <AppText variant="caption" color="muted">
            Por cobrar: {formatMoney(pendingTotal)}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

function CatalogItem({ catalog, colors, onPress }: { catalog: { id: string; name: string; format: string; productIds: string[]; createdAt: string }; colors: ReturnType<typeof useThemeColors>; onPress: () => void }) {
  const { style, onPressIn, onPressOut } = useScalePress();
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir catalogo ${catalog.name}`}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
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
    </Animated.View>
  );
}

function HeaderAction({ onPress, colors }: { onPress: () => void; colors: ReturnType<typeof useThemeColors> }) {
  const { style, onPressIn, onPressOut } = useScalePress();
  return (
    <Animated.View style={style}>
      <Pressable accessibilityRole="button" onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.sectionHeaderAction}>
        <AppText variant="label" color="accent">Ver todos</AppText>
      </Pressable>
    </Animated.View>
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
  const tileScale = useSharedValue(1);

  const tileAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tileScale.value }],
  }));

  const handleTilePressIn = useCallback(() => {
    tileScale.value = withSpring(0.96, { damping: 12 });
  }, [tileScale]);

  const handleTilePressOut = useCallback(() => {
    tileScale.value = withSpring(1, { damping: 12 });
  }, [tileScale]);

  return (
    <Animated.View style={tileAnimatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={badge ? `${label}, ${badge} notificaciones` : label}
        onPress={onPress}
        onPressIn={handleTilePressIn}
        onPressOut={handleTilePressOut}
        style={[
          styles.quickTile,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
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
      </Animated.View>
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
    borderRadius: borderRadius.lg,
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
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeaderCompact: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sectionHeaderAction: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  quickTile: {
    ...shadows.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flex: 1,
    minWidth: 140,
    minHeight: 96,
    padding: spacing.md,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  pendingIcon: {
    alignItems: 'center',
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
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
