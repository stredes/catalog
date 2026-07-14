import { useState } from 'react';
import { Image, Pressable, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';
import { EditorialTextArea } from './EditorialTextArea';
import { GenerateButton } from './GenerateButton';
import type { EditorialProductContent } from '../../domain/entities/EditorialContent';
import type { Product } from '../../../products/domain/entities/Product';

type ProductFieldKey = 'description' | 'benefits' | 'highlights' | 'uses' | 'specifications' | 'quote' | 'notes';

type Props = {
  product: Product;
  familyName: string;
  editorial: EditorialProductContent;
  onFieldChange: (productId: string, field: keyof EditorialProductContent, value: string | boolean) => void;
  onGenerateField: (productId: string, field: Exclude<ProductFieldKey, 'notes'>) => void;
  disabled?: boolean;
  compact?: boolean;
};

const FIELD_CONFIG: { key: ProductFieldKey; label: string; placeholder: string; autoGenerable: boolean }[] = [
  { key: 'description', label: 'Descripción Comercial', placeholder: 'Describe este producto de forma atractiva...', autoGenerable: true },
  { key: 'benefits', label: 'Beneficios', placeholder: 'Lista los beneficios principales...', autoGenerable: true },
  { key: 'highlights', label: 'Características Destacadas', placeholder: 'Destaca las cualidades clave...', autoGenerable: true },
  { key: 'uses', label: 'Usos Recomendados', placeholder: 'Indica las aplicaciones ideales...', autoGenerable: true },
  { key: 'specifications', label: 'Especificaciones', placeholder: 'Detalla las especificaciones técnicas...', autoGenerable: true },
  { key: 'quote', label: 'Frase Destacada', placeholder: 'Una frase corta y memorable...', autoGenerable: true },
  { key: 'notes', label: 'Notas', placeholder: 'Notas adicionales...', autoGenerable: false },
];

const FORMAT_LABELS: Record<string, string> = {
  unit: 'Unidad', box: 'Caja', pack: 'Paquete', service: 'Servicio',
};

export function ProductEditorialCard({
  product,
  familyName,
  editorial,
  onFieldChange,
  onGenerateField,
  disabled,
  compact,
}: Props) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const hasAnyContent = editorial.description || editorial.benefits || editorial.quote || editorial.notes;

  return (
    <Card
      style={{
        marginBottom: spacing.md,
        padding: 0,
        overflow: 'hidden',
        borderColor: hasAnyContent ? colors.primary + '40' : colors.borderDefault,
      }}
    >
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        {product.photoUri ? (
          <Image
            source={{ uri: product.photoUri }}
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.md,
              backgroundColor: colors.borderSubtle,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.md,
              backgroundColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="image-outline" size={22} color={colors.textMuted} />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" color="primary" weight="semiBold" numberOfLines={1}>
            {product.name}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
            <AppText variant="caption" color="accent">
              ${product.price.toLocaleString('es-CL')}
            </AppText>
            {product.code ? (
              <AppText variant="caption" color="muted">
                · {product.code}
              </AppText>
            ) : null}
            <AppText variant="caption" color="muted">
              · {FORMAT_LABELS[product.format] ?? product.format}
            </AppText>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {hasAnyContent && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.primary,
              }}
            />
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          <View
            style={{
              height: 1,
              backgroundColor: colors.borderSubtle,
              marginBottom: spacing.lg,
            }}
          />

          {FIELD_CONFIG.map((field) => (
            <View key={field.key} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText
                  variant="labelMedium"
                  color="muted"
                  style={{ marginBottom: spacing.xs, flex: 1 }}
                >
                  {field.label}
                </AppText>
                {!disabled && field.autoGenerable && (
                  <GenerateButton
                    label="Generar"
                    onPress={() => onGenerateField(product.id, field.key as Exclude<ProductFieldKey, 'notes'>)}
                    compact
                  />
                )}
              </View>
              <EditorialTextArea
                label=""
                value={(editorial as any)[field.key] ?? ''}
                onChangeText={(text) => onFieldChange(product.id, field.key, text)}
                placeholder={field.placeholder}
                disabled={disabled}
                numberOfLines={field.key === 'quote' || field.key === 'notes' ? 2 : 3}
              />
            </View>
          ))}

          <Pressable
            onPress={() => onFieldChange(product.id, 'savedForFuture', !editorial.savedForFuture)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingVertical: spacing.sm,
              marginTop: spacing.xs,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: editorial.savedForFuture ? colors.primary : colors.textMuted,
                backgroundColor: editorial.savedForFuture ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {editorial.savedForFuture && (
                <Ionicons name="checkmark" size={14} color={colors.textInverse} />
              )}
            </View>
            <AppText variant="caption" color="secondary">
              Guardar este contenido para futuros catálogos
            </AppText>
          </Pressable>
        </View>
      )}
    </Card>
  );
}
