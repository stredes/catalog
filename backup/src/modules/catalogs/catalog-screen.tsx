import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { SqliteProductRepository } from '../products/infrastructure/repositories/sqlite-product-repository';
import { PdfService } from '../pdf/pdf-service';
import { ShareService } from '../sharing/share-service';
import { getDefaultFamilies } from '../families/index';

const repository = new SqliteProductRepository();
const pdfService = new PdfService();
const shareService = new ShareService();

export function CatalogScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const allProducts = await repository.findAll();
      if (allProducts.length === 0) {
        setError('No hay productos para generar el catálogo.');
        return;
      }
      const pdfUri = await pdfService.generateCatalogPdf(
        allProducts.map((p) => ({ name: p.name, price: p.price.value })),
      );
      await shareService.shareFile(pdfUri);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear catálogo</Text>
      <Text style={styles.subtitle}>Familias disponibles:</Text>
      {getDefaultFamilies().map((f) => (
        <Text key={f.id} style={styles.familyItem}>- {f.name}</Text>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 16 }} />
      ) : (
        <Button title="Generar y compartir catálogo" onPress={handleGenerate} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 8, color: '#555' },
  familyItem: { fontSize: 14, color: '#333', marginBottom: 4 },
  error: { color: '#d32f2f', marginTop: 12 },
});
