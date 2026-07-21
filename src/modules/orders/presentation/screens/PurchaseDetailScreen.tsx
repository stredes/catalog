import { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  BottomSheet,
  Card,
  EmptyStateIllustrated,
  Header,
  PrimaryButton,
  SecondaryButton,
  Screen,
  SearchBar,
  Divider,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing, borderRadius } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { Product } from '../../../products/domain/entities/product';
import { CartItem } from '../../domain/entities/CartItem';

type SelectedItem = {
  productId: string;
  productName: string;
  productCode?: string;
  unitPrice: number;
  quantity: number;
  format: string;
  subtotal: number;
};

export function PurchaseDetailScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { products } = useProducts();
  const { profile } = useProfile();

  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showQuantityDialog, setShowQuantityDialog] = useState<Product | null>(null);
  const [tempQuantity, setTempQuantity] = useState('1');
  const [generating, setGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.subtotal, 0),
    [selectedItems],
  );
  const totalItems = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.quantity, 0),
    [selectedItems],
  );

  const filteredProducts = useMemo(() => {
    if (!pickerSearch) return products;
    const q = pickerSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)),
    );
  }, [products, pickerSearch]);

  function openQuantityDialog(product: Product) {
    const existing = selectedItems.find((i) => i.productId === product.id);
    setTempQuantity(existing ? String(existing.quantity) : '1');
    setShowQuantityDialog(product);
  }

  function confirmQuantity() {
    if (!showQuantityDialog) return;
    const qty = parseInt(tempQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa un número mayor a 0');
      return;
    }

    const product = showQuantityDialog;
    const existing = selectedItems.find((i) => i.productId === product.id);

    if (existing) {
      if (qty === 0) {
        setSelectedItems((prev) => prev.filter((i) => i.productId !== product.id));
      } else {
        setSelectedItems((prev) =>
          prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: qty, subtotal: qty * i.unitPrice }
              : i,
          ),
        );
      }
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          unitPrice: product.price,
          quantity: qty,
          format: product.format,
          subtotal: qty * product.price,
        },
      ]);
    }

    setShowQuantityDialog(null);
  }

  function removeItem(productId: string) {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function updateQty(productId: string, delta: number) {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null;
          return { ...i, quantity: newQty, subtotal: newQty * i.unitPrice };
        })
        .filter(Boolean) as SelectedItem[],
    );
  }

  async function generatePdf() {
    if (!supplierName.trim()) {
      setError('Ingresa el nombre del proveedor');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Selecciona al menos un producto');
      return;
    }

    try {
      setError('');
      setGenerating(true);

      const items: CartItem[] = selectedItems.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        format: i.format,
        subtotal: i.subtotal,
      }));

      const order = {
        id: `pd_${Date.now()}`,
        orderNumber: 0,
        clientName: supplierName.trim(),
        items,
        subtotal,
        iva: 0,
        total: subtotal,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const uri = await useCases.generateOrderPdf.execute(order as any, profile);
      setPdfUri(uri);
      setShowResult(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el PDF');
    } finally {
      setGenerating(false);
    }
  }

  async function sharePdf() {
    if (!pdfUri) return;
    try {
      await useCases.shareCatalogPdf.shareFile(pdfUri, `Compra - ${supplierName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo compartir');
    }
  }

  function resetForm() {
    setSupplierName('');
    setNotes('');
    setSelectedItems([]);
    setPdfUri(null);
    setShowResult(false);
    setError('');
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Compra proveedor"
          title="Detalle de compra"
          subtitle={selectedItems.length > 0 ? `${totalItems} productos - ${formatMoney(subtotal)}` : 'Selecciona productos para tu pedido'}
          action={
            selectedItems.length > 0 ? (
              <Pressable onPress={() => setSelectedItems([])} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </Pressable>
            ) : undefined
          }
        />

        <Card>
          <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Proveedor</AppText>
          <TextInput
            placeholder="Nombre del proveedor"
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
            }}
            value={supplierName}
            onChangeText={setSupplierName}
          />
        </Card>

        <PrimaryButton
          label="Seleccionar productos"
          icon="add-circle-outline"
          onPress={() => setShowProductPicker(true)}
        />

        {selectedItems.length > 0 ? (
          <>
            {selectedItems.map((item) => (
              <Card key={item.productId} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' } as any}>
                      {item.productName}
                    </AppText>
                    {item.productCode ? (
                      <AppText variant="caption" color="muted">Cod: {item.productCode}</AppText>
                    ) : null}
                    <AppText variant="bodySmall" color="muted" style={{ marginTop: 2 }}>
                      {item.format} - {formatMoney(item.unitPrice)} c/u
                    </AppText>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                    <Pressable
                      onPress={() => updateQty(item.productId, -1)}
                      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </Pressable>
                    <View style={{ width: 44, alignItems: 'center' }}>
                      <AppText variant="labelLarge" color="primary" style={{ fontWeight: '700' } as any}>
                        {item.quantity}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={() => updateQty(item.productId, 1)}
                      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </Pressable>
                  </View>

                  <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                    <AppText variant="price" color="accent">{formatMoney(item.subtotal)}</AppText>
                    <Pressable onPress={() => removeItem(item.productId)} style={{ marginTop: 4 }}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))}

            <Divider />

            <Card variant="elevated" style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="bodyMedium" color="muted">Subtotal</AppText>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>{formatMoney(subtotal)}</AppText>
              </View>
              <Divider />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="headingSmall" color="primary">Total</AppText>
                <AppText variant="headingSmall" color="accent" style={{ fontWeight: '700' } as any}>{formatMoney(subtotal)}</AppText>
              </View>
            </Card>

            <Card>
              <TextInput
                placeholder="Notas (opcional)"
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
                }}
                value={notes}
                onChangeText={setNotes}
              />
            </Card>

            {error ? (
              <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' } as any}>{error}</AppText>
            ) : null}

            <PrimaryButton
              label={generating ? 'Generando...' : 'Generar detalle de compra'}
              icon="document-text-outline"
              onPress={generatePdf}
              disabled={generating}
            />
          </>
        ) : (
          <EmptyStateIllustrated
            icon="cart-outline"
            title="Sin productos"
            subtitle="Toca 'Seleccionar productos' para agregar productos a tu detalle de compra."
          />
        )}
      </Screen>

      {/* Product Picker BottomSheet */}
      <BottomSheet
        visible={showProductPicker}
        onClose={() => { setShowProductPicker(false); setPickerSearch(''); }}
        title="Seleccionar productos"
      >
        <SearchBar value={pickerSearch} onChange={setPickerSearch} placeholder="Buscar producto..." />
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedItems.some((i) => i.productId === item.id);
            return (
              <Pressable
                onPress={() => openQuantityDialog(item)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                  marginBottom: 8,
                })}
              >
                <Card style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 1.5 : 1,
                }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' } as any}>
                      {item.name}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {item.format} · {formatMoney(item.price)}
                    </AppText>
                  </View>
                  {isSelected ? (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  ) : (
                    <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
                  )}
                </Card>
              </Pressable>
            );
          }}
        />
      </BottomSheet>

      {/* Quantity Dialog */}
      <BottomSheet
        visible={showQuantityDialog !== null}
        onClose={() => setShowQuantityDialog(null)}
        title={showQuantityDialog?.name ?? ''}
        stickyFooter={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton label="Cancelar" onPress={() => setShowQuantityDialog(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Confirmar" onPress={confirmQuantity} />
            </View>
          </View>
        }
      >
        {showQuantityDialog && (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <AppText variant="bodyMedium" color="muted" style={{ marginBottom: 12 }}>
              {formatMoney(showQuantityDialog.price)} c/u
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => {
                  const q = parseInt(tempQuantity, 10) - 1;
                  if (q > 0) setTempQuantity(String(q));
                }}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <TextInput
                value={tempQuantity}
                onChangeText={setTempQuantity}
                keyboardType="numeric"
                style={{
                  width: 80,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  borderBottomWidth: 2,
                  borderBottomColor: colors.primary,
                  paddingVertical: 4,
                }}
              />
              <Pressable
                onPress={() => {
                  const q = parseInt(tempQuantity, 10) + 1;
                  setTempQuantity(String(q));
                }}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
            <AppText variant="bodyMedium" color="primary" style={{ marginTop: 12, fontWeight: '600' } as any}>
              Subtotal: {formatMoney((parseInt(tempQuantity, 10) || 0) * showQuantityDialog.price)}
            </AppText>
          </View>
        )}
      </BottomSheet>

      {/* Result BottomSheet */}
      <BottomSheet
        visible={showResult}
        onClose={() => setShowResult(false)}
        title="Detalle generado"
        stickyFooter={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton label="Nuevo" onPress={resetForm} />
            </View>
            {pdfUri && (
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Compartir" icon="share-social-outline" onPress={sharePdf} />
              </View>
            )}
          </View>
        }
      >
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          {generating ? (
            <>
              <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 12 }} />
              <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>Generando PDF...</AppText>
            </>
          ) : pdfUri ? (
            <>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="document-text" size={28} color={colors.success} />
              </View>
              <AppText variant="headingMedium" color="primary" style={{ textAlign: 'center' } as any}>{supplierName}</AppText>
              <AppText variant="bodySmall" color="secondary" style={{ marginTop: 4 }}>
                {selectedItems.length} productos · {formatMoney(subtotal)}
              </AppText>
            </>
          ) : null}
        </Card>
      </BottomSheet>

      {error && !showResult ? (
        <View style={{ position: 'absolute', bottom: 100, left: 16, right: 16, backgroundColor: colors.errorLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.error }}>
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' } as any}>{error}</AppText>
        </View>
      ) : null}

      <BottomMenu />
    </>
  );
}
