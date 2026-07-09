import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  Card,
  FloatingActionButton,
  Header,
  MetricCard,
  QuickActionCard,
  RecentProductCard,
  Screen,
  Section,
  SecondaryButton,
  EmptyState,
} from '../../../../shared/presentation/components/ui';
import { formatMoney } from '../../../../shared/utils/money';
import { useCatalogs } from '../hooks/useCatalogs';
import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useDependencies } from '../../../../bootstrap/dependencies';

export function DashboardScreen() {
  const { navigate } = useAppNavigation();
  const { products, loading: productsLoading } = useProducts();
  const { families, loading: familiesLoading } = useFamilies();
  const { catalogs } = useCatalogs();
  const { useCases } = useDependencies();
  const [seeding, setSeeding] = useState(false);
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const inventoryValue = useMemo(
    () => products.reduce((total, p) => total + p.price, 0),
    [products],
  );

  const recentCatalogs = useMemo(() => [...catalogs].reverse().slice(0, 3), [catalogs]);
  const recentProducts = useMemo(() => [...products].reverse().slice(0, 4), [products]);

  async function handleSeed() {
    const hasData = await useCases.seed.hasExistingData();

    if (hasData) {
      Alert.alert(
        '¿Reemplazar datos?',
        'Ya existen familias y productos. Se borrarán todos los datos actuales y se cargarán los datos de prueba. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reemplazar', style: 'destructive', onPress: () => executeSeed() },
        ],
      );
    } else {
      executeSeed();
    }
  }

  async function executeSeed() {
    setSeeding(true);
    try {
      const result = await useCases.seed.execute();
      Alert.alert(
        'Datos cargados',
        `Se insertaron ${result.families} familias y ${result.products} productos.`,
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Ocurrio un error al cargar los datos.');
    } finally {
      setSeeding(false);
    }
  }

  return (
    <>
      <Screen>
        <Header
          title="Catalog Clean"
          subtitle="Gestiona tus productos y genera catálogos profesionales."
        />

        <Section title="Acciones rápidas">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <QuickActionCard
                icon="add-circle-outline"
                label="Nuevo Producto"
                onPress={() => navigate('Products')}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <QuickActionCard
                icon="document-outline"
                label="Generar Catálogo"
                onPress={() => navigate('CatalogBuilder')}
                color={colors.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <QuickActionCard
                icon="share-social-outline"
                label="Compartir"
                onPress={() => {
                  if (catalogs.length > 0) navigate('Catalogs');
                }}
                color={colors.secondary}
              />
            </View>
          </View>
        </Section>

        <Section title="Resumen">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <MetricCard
              label="Productos"
              value={String(products.length)}
              icon="cube-outline"
              accent={colors.primary}
            />
            <MetricCard
              label="Familias"
              value={String(families.length)}
              icon="folder-outline"
              accent={colors.secondary}
            />
            <MetricCard
              label="Catálogos"
              value={String(catalogs.length)}
              icon="document-text-outline"
              accent={colors.success}
            />
            <MetricCard
              label="Valor Inventario"
              value={formatMoney(inventoryValue)}
              icon="cash-outline"
              accent={colors.warning}
            />
          </View>
        </Section>

        {recentCatalogs.length > 0 ? (
          <Section
            title="Últimos catálogos"
            action={
              <Pressable onPress={() => navigate('Catalogs')}>
              <AppText variant="labelMedium" color="accent">
                Ver todos →
              </AppText>
            </Pressable>
            }
          >
            {recentCatalogs.map((c) => (
              <Card key={c.id} variant="default" style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="document-text-outline" size={18} color={colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>{c.name}</AppText>
                    <AppText variant="bodySmall" color="muted">{c.productIds.length} productos</AppText>
                  </View>
                  <AppText variant="caption" color="muted">{new Date(c.createdAt).toLocaleDateString('es-CL')}</AppText>
                </View>
              </Card>
            ))}
          </Section>
        ) : null}

        {recentProducts.length > 0 ? (
          <Section
            title="Productos recientes"
            action={
              <Pressable onPress={() => navigate('Products')}>
                <AppText variant="labelMedium" color="accent">
                  Ver todos →
                </AppText>
              </Pressable>
            }
          >
            {recentProducts.map((p) => (
              <RecentProductCard
                key={p.id}
                name={p.name}
                format={p.format}
                price={formatMoney(p.price)}
              />
            ))}
          </Section>
        ) : (
          <>
            <EmptyState
              icon="cube-outline"
              title="Comienza aquí"
              description="Agrega tu primer producto para empezar a crear catálogos profesionales."
              actionLabel="Crear producto"
              onAction={() => navigate('Products')}
            />
            {__DEV__ && !productsLoading && !familiesLoading ? (
              <View style={{ marginTop: 4, paddingHorizontal: 20 }}>
                <SecondaryButton
                  label={seeding ? 'Cargando...' : 'Cargar datos de prueba'}
                  icon="flask-outline"
                  onPress={handleSeed}
                  disabled={seeding}
                />
              </View>
            ) : null}
          </>
        )}
      </Screen>

      <FloatingActionButton
        icon="add"
        label="Producto"
        onPress={() => navigate('Products')}
        bottom={insets.bottom + 108}
      />
      <BottomMenu />
    </>
  );
}
