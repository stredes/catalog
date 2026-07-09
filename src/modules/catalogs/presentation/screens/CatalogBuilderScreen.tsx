import { useMemo, useState } from 'react';
import { Image, Pressable, View, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  Card,
  CardHeader,
  ChoiceChip,
  EmptyStateIllustrated,
  Header,
  Input,
  PrimaryButton,
  Screen,
  SecondaryButton,
  WizardStep,
} from '../../../../shared/presentation/components/ui';
import { Catalog, CatalogFormat } from '../../domain/entities/Catalog';
import { CatalogGenerationStage } from '../../../pdf/domain/PdfGenerator';
import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useCatalogSelection } from '../hooks/useCatalogSelection';
import { FamilySelectionCard } from '../components/FamilySelectionCard';
import { ProductSelectionCard } from '../components/ProductSelectionCard';
import { SelectionSummaryBar } from '../components/SelectionSummaryBar';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';

const TOTAL_STEPS = 5;

const formatPreviews: Record<CatalogFormat, { label: string; desc: string; icon: string; columns: number }> = {
  'grid-2': { label: 'Grilla 2', desc: '2 columnas, ideal para fotos grandes', icon: 'grid-outline', columns: 2 },
  'grid-3': { label: 'Grilla 3', desc: '3 columnas, vista compacta', icon: 'grid-outline', columns: 3 },
  'grid-4x5': { label: 'Grilla 4×5', desc: '4 columnas, 20 productos por página', icon: 'grid-outline', columns: 4 },
  'grid-3x7': { label: 'Grilla 3×7', desc: '3 columnas, 21 productos por página', icon: 'grid-outline', columns: 3 },
  'simple-list': { label: 'Lista simple', desc: 'Formato lista con precios', icon: 'list-outline', columns: 1 },
  'premium-cover': { label: 'Portada premium', desc: 'Con portada oscura destacada', icon: 'star-outline', columns: 2 },
};

export function CatalogBuilderScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { families } = useFamilies();
  const { products, loading: productsLoading } = useProducts();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CatalogFormat>('grid-2');
  const [generated, setGenerated] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progressStage, setProgressStage] = useState<CatalogGenerationStage | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);

  const sel = useCatalogSelection(products, families);

  const familyName = useMemo(
    () => {
      if (sel.state.selectedFamilyIds.length === 1) {
        return families.find((f) => f.id === sel.state.selectedFamilyIds[0])?.name ?? '';
      }
      if (sel.state.selectedFamilyIds.length > 1) {
        return `${sel.state.selectedFamilyIds.length} familias`;
      }
      return '';
    },
    [families, sel.state.selectedFamilyIds],
  );

  const selectedProducts = useMemo(
    () => sel.selectionResult.selectedProducts,
    [sel.selectionResult.selectedProducts],
  );

  function canGoNext(): boolean {
    switch (step) {
      case 0: return name.trim().length >= 2;
      case 1: return sel.canSubmit;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  }

  async function generatePdf() {
    try {
      setError('');
      setBusy(true);
      setProgressStage('preparing');
      setProgressCurrent(0);
      setProgressTotal(0);

      const catalog = await useCases.generateCatalogPdf.execute(
        {
          name: name.trim(),
          familyId: sel.state.selectedFamilyIds[0] ?? '',
          familyIds: sel.state.selectedFamilyIds.length > 1
            ? sel.state.selectedFamilyIds
            : undefined,
          format,
          productIds: sel.selectionResult.selectedProductIds,
        },
        (progress) => {
          setProgressStage(progress.stage);
          if (progress.current !== undefined) setProgressCurrent(progress.current);
          if (progress.total !== undefined) setProgressTotal(progress.total);
        },
      );
      setGenerated(catalog);
      setStep(4);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo generar el catálogo.',
      );
    } finally {
      setBusy(false);
      setProgressStage(null);
    }
  }

  async function shareGenerated() {
    if (!generated) return;
    try {
      setError('');
      await useCases.shareCatalogPdf.execute(generated);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo compartir el PDF.',
      );
    }
  }

  function resetForm() {
    setStep(0);
    setName('');
    setFormat('grid-2');
    setGenerated(null);
    setError('');
    sel.resetSelection();
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <WizardStep step={0} total={TOTAL_STEPS} title="Nombre del catálogo">
            <AppText variant="bodyMedium" color="secondary" style={{ marginBottom: 16 }}>
              Elige un nombre descriptivo para identificar este catálogo fácilmente.
            </AppText>
            <Input
              label="Nombre"
              placeholder="Ej: Catálogo Verano 2026"
              value={name}
              onChangeText={setName}
              error={name.trim().length > 0 && name.trim().length < 2 ? 'Mínimo 2 caracteres' : undefined}
            />
          </WizardStep>
        );

      case 1:
        return renderSelectionStep();

      case 2:
        return (
          <WizardStep step={2} total={TOTAL_STEPS} title="Elegir diseño PDF">
            <AppText variant="bodyMedium" color="secondary" style={{ marginBottom: 16 }}>
              Selecciona el formato visual para tu catálogo. {sel.selectionResult.totalProductsCount} productos incluidos.
            </AppText>
            {(Object.entries(formatPreviews) as [CatalogFormat, typeof formatPreviews['grid-2']][]).map(([key, fmt]) => (
              <Pressable
                key={key}
                onPress={() => setFormat(key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: format === key ? colors.primary : colors.borderDefault,
                  backgroundColor: format === key ? colors.primary + '08' : colors.backgroundSurface,
                  marginBottom: 10,
                }}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: format === key ? colors.primary + '18' : colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={fmt.icon as any} size={24} color={format === key ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' } as any}>{fmt.label}</AppText>
                  <AppText variant="bodySmall" color="muted" style={{ marginTop: 1 }}>{fmt.desc}</AppText>
                </View>
                {format === key ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                  </View>
                ) : null}
              </Pressable>
            ))}
          </WizardStep>
        );

      case 3:
        return renderPreviewStep();

      case 4:
        return (
          <WizardStep step={4} total={TOTAL_STEPS} title={generated ? '¡Catálogo generado!' : 'Generar catálogo'}>
            {generated ? (
              <Card>
                <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.success} style={{ marginBottom: 12 }} />
                  <AppText variant="headingMedium" color="primary" style={{ textAlign: 'center' } as any}>{name}</AppText>
                  <AppText variant="bodySmall" color="secondary" style={{ textAlign: 'center', marginTop: 4 } as any}>{familyName} · {formatPreviews[format]?.label ?? format}</AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>{sel.selectionResult.totalProductsCount} productos</AppText>
                </View>
                <View style={{ height: 16 }} />
                <PrimaryButton label="Compartir PDF" icon="share-social-outline" onPress={shareGenerated} />
                <View style={{ height: 8 }} />
                <SecondaryButton label="Crear otro catálogo" icon="add-circle-outline" onPress={resetForm} />
              </Card>
            ) : null}
          </WizardStep>
        );

      default:
        return null;
    }
  }

  function renderPreviewStep() {
    const previewCols = formatPreviews[format]?.columns ?? 2;
    const gap = 10;

    return (
      <WizardStep step={3} total={TOTAL_STEPS} title="Vista previa">
        <AppText variant="bodyMedium" color="secondary" style={{ marginBottom: 16 }}>
          Revisa cómo se verán los productos en el formato {formatPreviews[format]?.label ?? format}.
        </AppText>

        {/* Summary card */}
        <Card style={{ marginBottom: 16, padding: 14 }}>
          <View style={{ gap: 6 }}>
            <DetailRow label="Catálogo" value={name} colors={colors} />
            <DetailRow label="Familias" value={familyName} colors={colors} />
            <DetailRow label="Formato" value={formatPreviews[format]?.label ?? format} colors={colors} />
            <DetailRow label="Productos" value={`${sel.selectionResult.totalProductsCount} incluidos`} colors={colors} />
            {sel.state.excludedProductIds.length > 0 ? (
              <DetailRow label="Excluidos" value={`${sel.state.excludedProductIds.length} productos`} colors={colors} />
            ) : null}
          </View>
        </Card>

        {/* Product preview grid */}
        {selectedProducts.length === 0 ? (
          <EmptyStateIllustrated
            icon="cube-outline"
            title="Sin productos"
            subtitle="No hay productos seleccionados para mostrar."
          />
        ) : (
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -(gap / 2) }}>
              {selectedProducts.map((product) => {
                const cardWidth = previewCols > 1
                  ? `${(100 / previewCols) - (gap * (previewCols - 1) / previewCols)}%`
                  : '100%';
                const family = families.find((f) => f.id === product.familyId);

                return (
                  <View
                    key={product.id}
                    style={{
                      width: cardWidth as any,
                      paddingHorizontal: gap / 2,
                      marginBottom: gap,
                    }}
                  >
                    <View style={{
                      borderWidth: 1,
                      borderColor: colors.borderDefault,
                      borderRadius: radius.md,
                      backgroundColor: colors.backgroundSurface,
                      overflow: 'hidden',
                    }}>
                      {product.photoUri ? (
                        <Image
                          source={{ uri: product.photoUri }}
                          style={{ width: '100%', height: 90, backgroundColor: colors.borderSubtle }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{
                          width: '100%',
                          height: 90,
                          backgroundColor: colors.borderSubtle,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                        </View>
                      )}
                      <View style={{ padding: 8 }}>
                        <AppText
                          variant="bodySmall"
                          color="primary"
                          weight="semiBold"
                          numberOfLines={1}
                        >
                          {product.name}
                        </AppText>
                        <AppText variant="caption" color="accent" style={{ marginTop: 2 }}>
                          ${product.price.toLocaleString('es-CL')}
                        </AppText>
                        {family ? (
                          <AppText variant="caption" color="muted" numberOfLines={1} style={{ marginTop: 1 }}>
                            {family.name}
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <AppText variant="caption" color="muted" style={{ textAlign: 'center', marginTop: 4, marginBottom: 8 }}>
              {selectedProducts.length} producto{selectedProducts.length !== 1 ? 's' : ''} en vista previa
            </AppText>
          </ScrollView>
        )}

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ marginTop: 8, fontWeight: '600' } as any}>
            {error}
          </AppText>
        ) : null}

        {busy && progressStage ? (
          <Card style={{ marginTop: 12, padding: 16 }}>
            <View style={{ gap: 8, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AppText variant="bodyMedium" color="primary" weight="semiBold">
                {progressStage === 'preparing' && 'Preparando catálogo...'}
                {progressStage === 'optimizing-images' && (
                  progressTotal > 0
                    ? `Optimizando imágenes ${progressCurrent} de ${progressTotal}...`
                    : 'Optimizando imágenes...'
                )}
                {progressStage === 'building-document' && 'Construyendo documento...'}
                {progressStage === 'generating-pdf' && 'Generando PDF...'}
              </AppText>
              {progressTotal > 0 && progressStage === 'optimizing-images' ? (
                <View style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.borderSubtle,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${(progressCurrent / progressTotal) * 100}%`,
                    height: '100%',
                    backgroundColor: colors.primary,
                    borderRadius: 2,
                  }} />
                </View>
              ) : null}
            </View>
          </Card>
        ) : (
          <View style={{ marginTop: 12 }}>
            <PrimaryButton
              label="Confirmar y generar PDF"
              icon="document-outline"
              onPress={generatePdf}
              disabled={busy}
            />
          </View>
        )}
      </WizardStep>
    );
  }

  function renderSelectionStep() {
    if (families.length === 0 && !productsLoading) {
      return (
        <WizardStep step={1} total={TOTAL_STEPS} title="Selección">
          <EmptyStateIllustrated
            icon="folder-open-outline"
            title="Aún no tienes familias creadas."
            description="Crea una familia para organizar tus productos y generar catálogos más rápido."
          />
        </WizardStep>
      );
    }

    if (products.length === 0 && !productsLoading) {
      return (
        <WizardStep step={1} total={TOTAL_STEPS} title="Selección">
          <EmptyStateIllustrated
            icon="cube-outline"
            title="Aún no tienes productos."
            description="Agrega productos para generar tu primer catálogo."
          />
        </WizardStep>
      );
    }

    return (
      <WizardStep step={1} total={TOTAL_STEPS} title="Seleccionar contenido">
        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.borderSubtle,
          borderRadius: radius.lg,
          padding: 3,
          marginBottom: 16,
        }}>
          <Pressable
            onPress={() => sel.setActiveTab('families')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radius.md,
              backgroundColor: sel.state.activeTab === 'families' ? colors.backgroundSurface : 'transparent',
              alignItems: 'center',
            }}
          >
            <AppText
              variant="bodyMedium"
              color={sel.state.activeTab === 'families' ? 'primary' : 'muted'}
              weight="semiBold"
            >
              Por familias
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => sel.setActiveTab('products')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radius.md,
              backgroundColor: sel.state.activeTab === 'products' ? colors.backgroundSurface : 'transparent',
              alignItems: 'center',
            }}
          >
            <AppText
              variant="bodyMedium"
              color={sel.state.activeTab === 'products' ? 'primary' : 'muted'}
              weight="semiBold"
            >
              Por productos
            </AppText>
          </Pressable>
        </View>

        {sel.state.activeTab === 'families' ? renderFamiliesTab() : renderProductsTab()}

        {/* Selection Summary Bar */}
        <SelectionSummaryBar
          selectedFamiliesCount={sel.selectionResult.selectedFamiliesCount}
          totalProductsCount={sel.selectionResult.totalProductsCount}
          excludedProductsCount={sel.selectionResult.excludedProductsCount}
          onContinue={() => setStep(2)}
          canContinue={sel.canSubmit}
        />
      </WizardStep>
    );
  }

  function renderFamiliesTab() {
    return (
      <View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.borderDefault,
          paddingHorizontal: 14,
          height: 46,
          backgroundColor: colors.backgroundSurface,
          marginBottom: 12,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={sel.state.searchQuery}
            onChangeText={sel.setSearchQuery}
            placeholder="Buscar familias..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.textPrimary, paddingVertical: 0 }}
          />
          {sel.state.searchQuery ? (
            <Pressable onPress={() => sel.setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <AppText variant="bodySmall" color="secondary">
            {sel.state.selectedFamilyIds.length} de {families.length} familias seleccionadas
          </AppText>
          <Pressable onPress={sel.selectAllFamilies}>
            <AppText variant="labelLarge" color="accent">
              {sel.isEveryFamilySelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </AppText>
          </Pressable>
        </View>

        {sel.isEveryFamilySelected ? (
          <View style={{
            padding: 10,
            borderRadius: radius.md,
            backgroundColor: colors.success + '12',
            marginBottom: 12,
          }}>
            <AppText variant="bodySmall" color="success" weight="semiBold">
              Todas las familias seleccionadas.
            </AppText>
          </View>
        ) : null}

        <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator nestedScrollEnabled>
          {sel.familiesWithCount
            .filter((f) =>
              !sel.state.searchQuery.trim() ||
              f.name.toLowerCase().includes(sel.state.searchQuery.toLowerCase().trim()),
            )
            .map((family, index) => (
              <View key={family.id} style={{ marginBottom: 6 }}>
                <FamilySelectionCard
                  name={family.name}
                  productCount={family.productCount}
                  selected={sel.state.selectedFamilyIds.includes(family.id)}
                  colorIndex={index}
                  disabled={family.productCount === 0 && !sel.state.selectedFamilyIds.includes(family.id)}
                  onPress={() => sel.toggleFamily(family.id)}
                />
              </View>
            ))}
        </ScrollView>
      </View>
    );
  }

  function renderProductsTab() {
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
          contentContainerStyle={{ gap: 8 }}
        >
          <ChoiceChip
            label="Todas"
            selected={sel.state.familyFilter === null}
            onPress={() => sel.setFamilyFilter(null)}
          />
          {families.map((f) => (
            <ChoiceChip
              key={f.id}
              label={f.name}
              selected={sel.state.familyFilter === f.id}
              onPress={() => sel.setFamilyFilter(f.id)}
            />
          ))}
        </ScrollView>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: colors.borderDefault,
          paddingHorizontal: 14,
          height: 46,
          backgroundColor: colors.backgroundSurface,
          marginBottom: 12,
        }}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            value={sel.state.searchQuery}
            onChangeText={sel.setSearchQuery}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.textPrimary, paddingVertical: 0 }}
          />
          {sel.state.searchQuery ? (
            <Pressable onPress={() => sel.setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {sel.filteredProducts.length === 0 ? (
          <EmptyStateIllustrated
            icon="cube-outline"
            title="Sin productos"
            subtitle="No hay productos que coincidan con los filtros."
          />
        ) : (
          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator nestedScrollEnabled>
            {sel.filteredProducts.map((p) => {
              const status = sel.getProductStatus(p.id);
              const familyName = families.find((f) => f.id === p.familyId)?.name ?? '';
              return (
                <ProductSelectionCard
                  key={p.id}
                  name={p.name}
                  price={`$${p.price.toLocaleString('es-CL')}`}
                  format={p.format}
                  familyName={familyName}
                  photoUri={p.photoUri}
                  included={status === 'included'}
                  excluded={status === 'excluded'}
                  onPress={() => sel.toggleProduct(p.id)}
                />
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Crear catálogo"
          title="Nuevo PDF"
          subtitle="Sigue los pasos para generar un catálogo profesional."
        />

        {renderStep()}

        {!generated && step < 4 && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            {step > 0 ? (
              <View style={{ flex: 1 }}>
                <SecondaryButton label="Atrás" onPress={() => setStep((s) => Math.max(0, s - 1))} />
              </View>
            ) : null}
            {step < 3 ? (
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Siguiente"
                  onPress={() => setStep((s) => Math.min(3, s + 1))}
                  disabled={!canGoNext()}
                />
              </View>
            ) : null}
          </View>
        )}
      </Screen>
      <BottomMenu />
    </>
  );
}

function DetailRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <AppText variant="bodySmall" color="secondary">{label}</AppText>
      <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>{value}</AppText>
    </View>
  );
}
