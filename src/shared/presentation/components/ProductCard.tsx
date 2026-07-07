import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Product } from '../../../modules/products/domain/entities/product';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const formatLabel = {
    'grid-2': 'Cuadrícula 2',
    'grid-3': 'Cuadrícula 3',
    'list': 'Lista',
    'premium': 'Premium',
  }[product.format];

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {product.photoUri && <Image source={{ uri: product.photoUri }} style={styles.image} />}
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>${product.price.value.toFixed(2)}</Text>
          <Text style={styles.meta}>{formatLabel}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(product)} activeOpacity={0.7}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(product.id)} activeOpacity={0.7}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  content: { flexDirection: 'row', gap: spacing.md },
  image: { width: 64, height: 64, borderRadius: borderRadius.md },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  meta: { fontSize: 12, color: colors.textTertiary },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.md },
  actionBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  editText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  deleteText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
});
