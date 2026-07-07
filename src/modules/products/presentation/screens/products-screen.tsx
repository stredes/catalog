import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useProducts } from '../hooks/use-products';
import { getDefaultFamilies } from '../../../families/index';
import { Product } from '../../domain/entities/product';
import { ProductFormat } from '../../domain/entities/product';
import {
  AppInput,
  AppButton,
  ChipSelector,
  ChipOption,
  PhotoPicker,
  ProductCard,
  EmptyState,
  ErrorBanner,
  LoadingOverlay,
  ModalForm,
} from '../../../../shared/presentation/components';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';

const FORMATS: ChipOption<ProductFormat>[] = [
  { label: 'Cuadrícula 2', value: 'grid-2' },
  { label: 'Cuadrícula 3', value: 'grid-3' },
  { label: 'Lista', value: 'list' },
  { label: 'Premium', value: 'premium' },
];

export function ProductsScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [format, setFormat] = useState<ProductFormat>('grid-2');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const families = getDefaultFamilies();
  const familyOptions: ChipOption<string>[] = families.map((f) => ({ label: f.name, value: f.id }));
  const [selectedFamily, setSelectedFamily] = useState(families[0]?.id ?? '');
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts(selectedFamily);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editFormat, setEditFormat] = useState<ProductFormat>('grid-2');
  const [editPhotoUri, setEditPhotoUri] = useState<string | null>(null);
  const [editFamilyId, setEditFamilyId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const resetCreateForm = () => {
    setName('');
    setPrice('');
    setFormat('grid-2');
    setPhotoUri(null);
  };

  const handleCreate = async () => {
    if (!name.trim() || !price.trim() || !selectedFamily) return;
    await createProduct({ name: name.trim(), price: Number(price), format, photoUri, familyId: selectedFamily });
    resetCreateForm();
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(String(product.price.value));
    setEditFormat(product.format);
    setEditPhotoUri(product.photoUri);
    setEditFamilyId(product.familyId);
    setModalVisible(true);
  };

  const handleUpdate = async () => {
    if (!editingProduct || !editName.trim() || !editPrice.trim() || !editFamilyId) return;
    await updateProduct(editingProduct.id, {
      name: editName.trim(),
      price: Number(editPrice),
      format: editFormat,
      photoUri: editPhotoUri,
      familyId: editFamilyId,
    });
    setModalVisible(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => deleteProduct(id);

  const canCreate = name.trim().length > 0 && price.trim().length > 0 && selectedFamily.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productos</Text>
      <ErrorBanner message={error} />

      <AppInput label="Nombre" placeholder="Nombre del producto" value={name} onChangeText={setName} />
      <AppInput label="Precio" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="numeric" />

      <ChipSelector label="Formato" options={FORMATS} selected={format} onSelect={setFormat} />
      <ChipSelector label="Familia" options={familyOptions} selected={selectedFamily} onSelect={setSelectedFamily} />
      <PhotoPicker label="Foto del producto" value={photoUri} onChange={setPhotoUri} />

      <AppButton title="Crear producto" onPress={handleCreate} disabled={!canCreate} />

      <LoadingOverlay visible={loading} />

      {!loading && (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <ProductCard product={item} onEdit={openEditModal} onDelete={handleDelete} />
          )}
          ListEmptyComponent={<EmptyState message="No hay productos en esta familia." />}
        />
      )}

      <ModalForm
        visible={modalVisible}
        title="Editar producto"
        onCancel={() => setModalVisible(false)}
        onSave={handleUpdate}
      >
        <AppInput label="Nombre" placeholder="Nombre del producto" value={editName} onChangeText={setEditName} />
        <AppInput label="Precio" placeholder="0.00" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" />
        <ChipSelector label="Formato" options={FORMATS} selected={editFormat} onSelect={setEditFormat} />
        <ChipSelector
          label="Familia"
          options={familyOptions}
          selected={editFamilyId}
          onSelect={setEditFamilyId}
        />
        <PhotoPicker label="Foto del producto" value={editPhotoUri} onChange={setEditPhotoUri} />
      </ModalForm>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { ...typography.h1, marginBottom: spacing.xl },
});
