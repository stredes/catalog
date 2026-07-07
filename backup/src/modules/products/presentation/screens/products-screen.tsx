import React, { useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useProducts } from '../hooks/use-products';
import { getDefaultFamilies } from '../../../families/index';

export function ProductsScreen() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const families = getDefaultFamilies();
  const [selectedFamily, setSelectedFamily] = useState(families[0]?.id ?? '');
  const { products, loading, error, createProduct } = useProducts(selectedFamily);

  const handleCreate = async () => {
    if (!name.trim() || !price.trim() || !selectedFamily) return;
    await createProduct({
      name: name.trim(),
      price: Number(price),
      format: 'grid-2',
      photoUri: null,
      familyId: selectedFamily,
    });
    setName('');
    setPrice('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Productos</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput placeholder="Nombre" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} />
      <Text style={styles.label}>Familia:</Text>
      <View style={styles.familyRow}>
        {families.map((f) => (
          <Button key={f.id} title={f.name} onPress={() => setSelectedFamily(f.id)} color={selectedFamily === f.id ? '#007AFF' : '#999'} />
        ))}
      </View>
      <Button title="Crear producto" onPress={handleCreate} disabled={!name.trim() || !price.trim()} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text>${item.price.value}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No hay productos en esta familia.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7f7f7' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 },
  familyRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  error: { color: '#d32f2f', marginBottom: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 24 },
});
