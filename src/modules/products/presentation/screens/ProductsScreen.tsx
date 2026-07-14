import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useState } from 'react';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { Alert, Animated, Image, PanResponder, Pressable, TextInput, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  BottomSheet,
  Badge,
  Card,
  ChoiceChip,
  EmptyStateIllustrated,
  FloatingActionButton,
  Header,
  PrimaryButton,
  ProductCard,
  Screen,
  SearchBar,
  SecondaryButton,
} from '../../../../shared/presentation/components/ui';
import { formatDate } from '../../../../shared/utils/dates';
import { formatMoney } from '../../../../shared/utils/money';
import { ProductInputDto, productSchema } from '../../application/dtos/ProductDtos';
import { Product, ProductFormat } from '../../domain/entities/Product';
import { useProducts } from '../hooks/useProducts';
import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formats: ProductFormat[] = ['unit', 'box', 'pack', 'service'];

type ViewMode = 'grid' | 'list';

function distanceBetweenTouches(touches: Array<{ pageX: number; pageY: number }>) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function PinchZoomImage({ uri }: { uri: string }) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;
  const lastScale = useRef(1);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
      onPanResponderGrant: (event) => {
        initialDistance.current = distanceBetweenTouches(event.nativeEvent.touches);
        initialScale.current = lastScale.current;
      },
      onPanResponderMove: (event) => {
        const distance = distanceBetweenTouches(event.nativeEvent.touches);
        if (!initialDistance.current || !distance) return;

        const nextScale = clamp(
          initialScale.current * (distance / initialDistance.current),
          1,
          4,
        );
        lastScale.current = nextScale;
        scale.setValue(nextScale);
      },
      onPanResponderRelease: () => {
        if (lastScale.current <= 1.03) {
          lastScale.current = 1;
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (lastScale.current <= 1.03) {
          lastScale.current = 1;
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
          }).start();
        }
      },
    }),
    [scale],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        width: '100%',
        height: 320,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.borderSubtle,
        overflow: 'hidden',
      }}
    >
      <Animated.Image
        source={{ uri }}
        style={{
          width: '100%',
          height: '100%',
          transform: [{ scale }],
        }}
        resizeMode="contain"
      />
    </View>
  );
}

export function ProductsScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { products, reload } = useProducts();
  const { families } = useFamilies();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState<Product | null>(null);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterFamily, setFilterFamily] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const form = useForm<ProductInputDto>({
    defaultValues: {
      name: '',
      price: 0,
      stock: 0,
      format: 'unit',
      familyId: '',
      photoUri: undefined,
    },
    resolver: zodResolver(productSchema) as Resolver<ProductInputDto>,
  });
  const selectedFamily = form.watch('familyId');
  const selectedFormat = form.watch('format');

  const familyById = useMemo(
    () => new Map(families.map((f) => [f.id, f.name])),
    [families],
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (filterFamily) {
      result = result.filter((p) => p.familyId === filterFamily);
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, search, filterFamily, sortBy]);

  async function submit(input: ProductInputDto) {
    try {
      setError('');
      const payload = { ...input, photoUri };

      if (editing) {
        await useCases.updateProduct.execute(editing.id, payload);
      } else {
        await useCases.createProduct.execute(payload);
      }

      setEditing(null);
      setPhotoUri(undefined);
      setShowForm(false);
      form.reset({ name: '', price: 0, stock: 0, format: 'unit', familyId: families[0]?.id ?? '' });
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo guardar el producto.',
      );
    }
  }

  function startEdit(product: Product) {
    setSelectedProduct(null);
    setEditing(product);
    setPhotoUri(product.photoUri);
    setShowForm(true);
    form.reset({
      name: product.name,
      code: product.code ?? '',
      price: product.price,
      stock: product.stock,
      format: product.format,
      familyId: product.familyId,
      photoUri: product.photoUri,
    });
  }

  async function pickFromCamera() {
    try {
      setError('');
      const uri = await useCases.pickProductImage.execute('camera');
      setPhotoUri(uri);
      form.setValue('photoUri', uri);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo tomar la foto.',
      );
    }
  }

  async function pickFromGallery() {
    try {
      setError('');
      const uri = await useCases.pickProductImage.execute('gallery');
      setPhotoUri(uri);
      form.setValue('photoUri', uri);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo seleccionar la foto.',
      );
    }
  }

  async function remove(id: string) {
    Alert.alert('Eliminar producto', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await useCases.deleteProduct.execute(id);
          setSelectedProduct((current) => (current?.id === id ? null : current));
          await reload();
        },
      },
    ]);
  }

  async function handleStockChange(product: Product, newStock: number) {
    if (newStock < 0) return;
    await useCases.updateStock.execute(product.id, newStock);
    await reload();
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Productos"
          title="Tu inventario"
          subtitle={products.length > 0 ? `${products.length} productos registrados` : 'Agrega tu primer producto'}
        />

        {products.length > 0 ? (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar productos..." />

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4 }}>
                  <ChoiceChip
                    label="Todos"
                    selected={filterFamily === null}
                    onPress={() => setFilterFamily(null)}
                  />
                  {families.map((f) => (
                    <ChoiceChip
                      key={f.id}
                      label={f.name}
                      selected={filterFamily === f.id}
                      onPress={() => setFilterFamily(f.id === filterFamily ? null : f.id)}
                    />
                  ))}
                </View>
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Pressable
                  onPress={() => setViewMode('grid')}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: viewMode === 'grid' ? colors.primary + '18' : 'transparent',
                  }}
                >
                  <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? colors.primary : colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => setViewMode('list')}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: viewMode === 'list' ? colors.primary + '18' : 'transparent',
                  }}
                >
                  <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? colors.primary : colors.textMuted} />
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <ChoiceChip
                label="Más recientes"
                selected={sortBy === 'newest'}
                onPress={() => setSortBy('newest')}
                color={colors.textSecondary}
              />
              <ChoiceChip
                label="Nombre"
                selected={sortBy === 'name'}
                onPress={() => setSortBy('name')}
                color={colors.textSecondary}
              />
              <ChoiceChip
                label="Precio"
                selected={sortBy === 'price'}
                onPress={() => setSortBy('price')}
                color={colors.textSecondary}
              />
            </View>
          </>
        ) : null}

        {filteredProducts.length === 0 ? (
          <EmptyStateIllustrated
            icon="cube-outline"
            title={products.length === 0 ? 'Sin productos' : 'Sin resultados'}
            subtitle={
              products.length === 0
                ? 'Agrega tu primer producto para empezar.'
                : 'No hay productos que coincidan con tu búsqueda.'
            }
            action={
              products.length === 0 ? (
                <PrimaryButton
                  label="Crear producto"
                  icon="add-circle-outline"
                  onPress={() => {
                    setEditing(null);
                    setPhotoUri(undefined);
          form.reset({ name: '', code: '', price: 0, stock: 0, format: 'unit', familyId: families[0]?.id ?? '' });
                    setShowForm(true);
                  }}
                />
              ) : undefined
            }
          />
        ) : viewMode === 'grid' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                price={formatMoney(p.price)}
                format={p.format}
                family={familyById.get(p.familyId) ?? ''}
                photoUri={p.photoUri}
                stock={p.stock}
                onPress={() => setSelectedProduct(p)}
                onEdit={() => startEdit(p)}
                onDelete={() => remove(p.id)}
                onIncrement={() => handleStockChange(p, p.stock + 1)}
                onDecrement={() => handleStockChange(p, p.stock - 1)}
                onStockChange={(newStock) => handleStockChange(p, newStock)}
              />
            ))}
          </View>
        ) : (
          filteredProducts.map((p) => (
            <Card key={p.id} style={{ marginBottom: 8 }} onPress={() => setSelectedProduct(p)}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {p.photoUri ? (
                  <Image
                    source={{ uri: p.photoUri }}
                    style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: colors.borderDefault }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 60, height: 60, borderRadius: 10, backgroundColor: colors.borderSubtle, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>{p.name}</AppText>
                  <AppText variant="price" color="accent" style={{ marginTop: 2 }}>{formatMoney(p.price)}</AppText>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <AppText variant="caption" color="muted">{familyById.get(p.familyId) ?? ''}</AppText>
                    <AppText variant="caption" color="disabled">·</AppText>
                    <AppText variant="caption" color="muted">{p.format}</AppText>
                    <AppText variant="caption" color="disabled">·</AppText>
                    <AppText variant="caption" color="muted">Stock: {p.stock}</AppText>
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <Pressable onPress={() => setSelectedProduct(p)} style={{ padding: 8 }}>
                    <Ionicons name="expand-outline" size={20} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => remove(p.id)} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}

        {error ? <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' } as any}>{error}</AppText> : null}
      </Screen>

      <FloatingActionButton
        icon="add"
        label="Producto"
        onPress={() => {
          setEditing(null);
          setPhotoUri(undefined);
          form.reset({ name: '', price: 0, stock: 0, format: 'unit', familyId: families[0]?.id ?? '' });
          setShowForm(true);
        }}
        bottom={insets.bottom + 108}
      />

      <BottomSheet
        visible={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Muestra del producto"
        stickyFooter={
          selectedProduct ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Editar"
                  icon="create-outline"
                  onPress={() => startEdit(selectedProduct)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Cerrar"
                  icon="checkmark-outline"
                  onPress={() => setSelectedProduct(null)}
                />
              </View>
            </View>
          ) : undefined
        }
      >
        {selectedProduct ? (
          <View>
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: colors.borderSubtle,
                borderWidth: 1,
                borderColor: colors.borderDefault,
                minHeight: 320,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedProduct.photoUri ? (
                <PinchZoomImage uri={selectedProduct.photoUri} />
              ) : (
                <View style={{ height: 320, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Ionicons name="image-outline" size={42} color={colors.textMuted} />
                  <AppText variant="bodySmall" color="muted">Sin foto</AppText>
                </View>
              )}
            </View>

            <View style={{ marginTop: 18, gap: 10 }}>
              <View>
                <AppText variant="headingMedium" color="primary">{selectedProduct.name}</AppText>
                <AppText variant="price" color="accent" style={{ marginTop: 4 }}>
                  {formatMoney(selectedProduct.price)}
                </AppText>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Badge label={selectedProduct.format} color={colors.primary} />
                {familyById.get(selectedProduct.familyId) ? (
                  <Badge label={familyById.get(selectedProduct.familyId) ?? ''} color={colors.secondary} />
                ) : null}
                {selectedProduct.code ? (
                  <Badge label={`Cod. ${selectedProduct.code}`} color={colors.success} />
                ) : null}
                <Badge label={`Stock: ${selectedProduct.stock}`} color={colors.warning} />
              </View>

              <Card style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Nombre</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right', fontWeight: '600' } as any}>
                    {selectedProduct.name}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Codigo</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {selectedProduct.code || 'Sin codigo'}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Familia</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {familyById.get(selectedProduct.familyId) || 'Sin familia'}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Formato</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {selectedProduct.format}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Stock</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right', fontWeight: '600' } as any}>
                    {selectedProduct.stock} unidades
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Creado</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {formatDate(selectedProduct.createdAt)}
                  </AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Actualizado</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {formatDate(selectedProduct.updatedAt)}
                  </AppText>
                </View>
              </Card>
            </View>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        stickyFooter={
          <PrimaryButton
            label={editing ? 'Guardar cambios' : 'Crear producto'}
            icon="save-outline"
            onPress={form.handleSubmit(submit)}
          />
        }
      >
        <TextInput
          placeholder="Nombre del producto"
          placeholderTextColor={colors.textMuted}
          style={{
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.borderDefault,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '500',
            color: colors.textPrimary,
            marginBottom: 12,
          }}
          value={form.watch('name')}
          onChangeText={(t) => form.setValue('name', t)}
        />
        <TextInput
          placeholder="Codigo (opcional)"
          placeholderTextColor={colors.textMuted}
          style={{
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.borderDefault,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 15,
            fontWeight: '500',
            color: colors.textPrimary,
            marginBottom: 12,
          }}
          value={form.watch('code')}
          onChangeText={(t) => form.setValue('code', t)}
        />
        <Controller
          control={form.control}
          name="price"
          render={({ field: { onChange, value } }) => (
            <TextInput
              keyboardType="numeric"
              placeholder="Precio"
              placeholderTextColor={colors.textMuted}
              style={{
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: colors.borderDefault,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontWeight: '500',
                color: colors.textPrimary,
                marginBottom: 12,
              }}
              value={value ? String(value) : ''}
              onChangeText={(t) => onChange(Number(t.replace(/[^0-9]/g, '')))}
            />
          )}
        />
        <Controller
          control={form.control}
          name="stock"
          render={({ field: { onChange, value } }) => (
            <TextInput
              keyboardType="numeric"
              placeholder="Stock"
              placeholderTextColor={colors.textMuted}
              style={{
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: colors.borderDefault,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontWeight: '500',
                color: colors.textPrimary,
                marginBottom: 12,
              }}
              value={value !== undefined ? String(value) : '0'}
              onChangeText={(t) => onChange(Number(t.replace(/[^0-9]/g, '')) || 0)}
            />
          )}
        />
        <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Formato</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {formats.map((fmt) => (
            <ChoiceChip key={fmt} label={fmt} selected={selectedFormat === fmt} onPress={() => form.setValue('format', fmt)} />
          ))}
        </View>
        <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Familia</AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {families.map((f) => (
              <ChoiceChip key={f.id} label={f.name} selected={selectedFamily === f.id} onPress={() => form.setValue('familyId', f.id)} />
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Cámara" icon="camera-outline" onPress={pickFromCamera} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton label={photoUri ? 'Cambiar foto' : 'Galería'} icon="images-outline" onPress={pickFromGallery} />
          </View>
        </View>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: 140, borderRadius: 12, marginTop: 12, backgroundColor: colors.borderDefault }} resizeMode="contain" />
        ) : null}
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
