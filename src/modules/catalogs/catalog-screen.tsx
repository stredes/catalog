import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GetAllProductsUseCase } from '../products/application/use-cases/get-all-products-use-case';
import { SqliteProductRepository } from '../products/infrastructure/repositories/sqlite-product-repository';
import { PdfService } from '../pdf/pdf-service';
import { ShareService } from '../sharing/share-service';
import { getDefaultFamilies } from '../families/index';
import { AppButton, ErrorBanner, LoadingOverlay } from '../../shared/presentation/components';
import { colors, spacing, typography, shadows } from '../../shared/presentation/theme';

const getAllProductsUseCase = new GetAllProductsUseCase(new SqliteProductRepository());
const pdfService = new PdfService();
const shareService = new ShareService();

export function CatalogScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const allProducts = await getAllProductsUseCase.execute();
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
      <View style={styles.header}>
        <Text style={styles.title}>Catálogo</Text>
        <Text style={styles.subtitle}>Generá un PDF con todos tus productos y compartilo al instante.</Text>
      </View>

      <ErrorBanner message={error} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Familias disponibles</Text>
        <View style={styles.badgeRow}>
          {getDefaultFamilies().map((f) => (
            <View key={f.id} style={styles.badge}>
              <Text style={styles.badgeText}>{f.name}</Text>
            </View>
          ))}
        </View>
      </View>

      <LoadingOverlay visible={loading} />

      {!loading && (
        <AppButton title="Generar y compartir catálogo" onPress={handleGenerate} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h1 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  cardTitle: { ...typography.h3, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  badgeText: { fontSize: 13, fontWeight: '500', color: colors.primary },
});
