import { useEffect, useState } from 'react';
import { Pressable, View, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  Card,
  Header,
  PrimaryButton,
  Screen,
  Section,
  SecondaryButton,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';
import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { EditorialTextArea } from '../components/EditorialTextArea';
import { GenerateButton } from '../components/GenerateButton';
import { CategoryEditorialCard } from '../components/CategoryEditorialCard';
import { ProductEditorialCard } from '../components/ProductEditorialCard';
import { useEditorialContent } from '../hooks/useEditorialContent';
import type { EditorialMode, EditorialProductContent } from '../../domain/entities/EditorialContent';

type Props = {
  selectedProductIds: string[];
  selectedFamilyIds: string[];
  onContinue: (content: import('../../domain/entities/EditorialContent').EditorialContent) => void;
  onBack: () => void;
};

const MODE_OPTIONS: { value: EditorialMode; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'basic', label: 'Utilizar solamente la información existente', description: 'Sin contenido editorial adicional', icon: 'document-text-outline' },
  { value: 'auto', label: 'Mejorar automáticamente las descripciones', description: 'Genera textos profesionales con un toque editorial', icon: 'sparkles' },
  { value: 'custom', label: 'Personalizar manualmente todo el contenido', description: 'Escribe cada texto desde cero', icon: 'create-outline' },
];

export function EditorialContentScreen({ selectedProductIds, selectedFamilyIds, onContinue, onBack }: Props) {
  const colors = useThemeColors();
  const { families } = useFamilies();
  const { products } = useProducts();
  const { profile } = useProfile();

  const selectedFamilies = families.filter((f) => selectedFamilyIds.includes(f.id));
  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  const businessName = profile?.businessName ?? 'Nuestro negocio';

  const editorial = useEditorialContent(selectedFamilies, selectedProducts, businessName);

  useEffect(() => {
    editorial.initCategories();
    editorial.initProducts();
  }, []);

  const handleModeChange = (mode: EditorialMode) => {
    editorial.setMode(mode);
    if (mode === 'auto') {
      editorial.autoGenerateAll();
    }
  };

  const isDisabled = editorial.content.mode === 'basic';

  return (
    <>
      <Screen>
        <Header
          eyebrow="Crear catálogo"
          title="Contenido Editorial"
          subtitle="Enriquece el contenido de tu catálogo antes de generar el PDF."
        />

        {/* Mode Selector */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
          <AppText variant="headingSmall" color="primary" style={{ marginBottom: spacing.md }}>
            ¿Cómo deseas crear el contenido?
          </AppText>
          <View style={{ gap: spacing.sm }}>
            {MODE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => handleModeChange(opt.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: 14,
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  borderColor: editorial.content.mode === opt.value ? colors.primary : colors.borderDefault,
                  backgroundColor: editorial.content.mode === opt.value ? colors.primary + '08' : colors.backgroundSurface,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: editorial.content.mode === opt.value ? colors.primary + '18' : colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={opt.icon}
                    size={22}
                    color={editorial.content.mode === opt.value ? colors.primary : colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" color="primary" weight="semiBold">
                    {opt.label}
                  </AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 1 }}>
                    {opt.description}
                  </AppText>
                </View>
                {editorial.content.mode === opt.value && (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Section 1: Catalog Info */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.primary + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="book-outline" size={16} color={colors.primary} />
              </View>
              <AppText variant="headingSmall" color="primary">
                Información del Catálogo
              </AppText>
            </View>
            {!isDisabled && (
              <GenerateButton
                label="Generar"
                onPress={editorial.autoGenerateSection}
                compact
              />
            )}
          </View>

          <EditorialTextArea
            label="Título"
            value={editorial.content.section.title}
            onChangeText={(t) => editorial.updateSection('title', t)}
            placeholder="Título principal del catálogo"
            disabled={isDisabled}
            numberOfLines={1}
          />
          <EditorialTextArea
            label="Subtítulo"
            value={editorial.content.section.subtitle}
            onChangeText={(t) => editorial.updateSection('subtitle', t)}
            placeholder="Subtítulo descriptivo"
            disabled={isDisabled}
            numberOfLines={1}
          />
          <EditorialTextArea
            label="Mensaje de bienvenida"
            value={editorial.content.section.welcomeMessage}
            onChangeText={(t) => editorial.updateSection('welcomeMessage', t)}
            placeholder="Mensaje de bienvenida para el lector"
            disabled={isDisabled}
          />
          <EditorialTextArea
            label="Introducción"
            value={editorial.content.section.introduction}
            onChangeText={(t) => editorial.updateSection('introduction', t)}
            placeholder="Introducción del catálogo"
            disabled={isDisabled}
          />
        </Card>

        {/* Section 2: About Us */}
        <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: colors.success + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="business-outline" size={16} color={colors.success} />
              </View>
              <AppText variant="headingSmall" color="primary">
                Sobre Nosotros
              </AppText>
            </View>
            {!isDisabled && (
              <GenerateButton
                label="Generar"
                onPress={editorial.autoGenerateAbout}
                compact
              />
            )}
          </View>

          <EditorialTextArea
            label="Descripción"
            value={editorial.content.about.description}
            onChangeText={(t) => editorial.updateAbout('description', t)}
            placeholder="Descripción general del negocio"
            disabled={isDisabled}
          />
          <EditorialTextArea
            label="Historia"
            value={editorial.content.about.history}
            onChangeText={(t) => editorial.updateAbout('history', t)}
            placeholder="Historia de la empresa"
            disabled={isDisabled}
          />
          <EditorialTextArea
            label="Misión"
            value={editorial.content.about.mission}
            onChangeText={(t) => editorial.updateAbout('mission', t)}
            placeholder="Misión de la empresa"
            disabled={isDisabled}
          />
          <EditorialTextArea
            label="Visión"
            value={editorial.content.about.vision}
            onChangeText={(t) => editorial.updateAbout('vision', t)}
            placeholder="Visión de la empresa"
            disabled={isDisabled}
          />
          <EditorialTextArea
            label="Valores"
            value={editorial.content.about.values}
            onChangeText={(t) => editorial.updateAbout('values', t)}
            placeholder="Valores fundamentales"
            disabled={isDisabled}
          />
        </Card>

        {/* Section 3: Categories */}
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.warning + '18',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="folder-open-outline" size={16} color={colors.warning} />
            </View>
            <AppText variant="headingSmall" color="primary">
              Categorías
            </AppText>
            <AppText variant="caption" color="muted" style={{ marginLeft: 'auto' }}>
              {selectedFamilies.length} seleccionada{selectedFamilies.length !== 1 ? 's' : ''}
            </AppText>
          </View>

          {selectedFamilies.map((family, idx) => {
            const catContent = editorial.content.categories.find((c) => c.familyId === family.id);
            const productCount = selectedProducts.filter((p) => p.familyId === family.id).length;
            return (
              <CategoryEditorialCard
                key={family.id}
                familyName={family.name}
                productCount={productCount}
                description={catContent?.description ?? ''}
                onDescriptionChange={(t) => editorial.updateCategoryDescription(family.id, t)}
                onGenerate={() => editorial.autoGenerateCategory(family.id)}
                disabled={isDisabled}
                colorIndex={idx}
              />
            );
          })}
        </View>

        {/* Section 4: Products */}
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.error + '18',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="cube-outline" size={16} color={colors.error} />
            </View>
            <AppText variant="headingSmall" color="primary">
              Productos
            </AppText>
            <AppText variant="caption" color="muted" style={{ marginLeft: 'auto' }}>
              {selectedProducts.length} seleccionado{selectedProducts.length !== 1 ? 's' : ''}
            </AppText>
          </View>

          <FlatList
            data={selectedProducts}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item: product }) => {
              const prodContent = editorial.content.products.find((p) => p.productId === product.id);
              const familyName = families.find((f) => f.id === product.familyId)?.name ?? '';
              const fallbackContent: EditorialProductContent = {
                productId: product.id,
                savedForFuture: false,
                description: '',
                benefits: '',
                highlights: '',
                uses: '',
                specifications: '',
                quote: '',
                notes: '',
              };
              return (
                <ProductEditorialCard
                  product={product}
                  familyName={familyName}
                  editorial={prodContent ?? fallbackContent}
                  onFieldChange={editorial.updateProductField}
                  onGenerateField={(pid, field) => editorial.autoGenerateProductField(pid, field)}
                  disabled={isDisabled}
                />
              );
            }}
          />
        </View>

        {/* Navigation */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: spacing.sm, paddingBottom: spacing.xl }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Atrás" onPress={onBack} />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Continuar"
              icon="arrow-forward-outline"
              onPress={() => onContinue(editorial.content)}
            />
          </View>
        </View>
      </Screen>
    </>
  );
}
