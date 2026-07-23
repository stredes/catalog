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
  Screen,
  SecondaryButton,
  SearchBar,
  Divider,
  ChoiceChip,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { formatMoney } from '../../../../shared/utils/money';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { useSuppliers } from '../hooks/useSuppliers';
import { usePurchaseCart } from '../../../orders/presentation/hooks/usePurchaseCart';
import { Product } from '../../../products/domain/entities/product';
import { PurchaseCartItem, PurchaseDiscountType } from '../../../orders/domain/entities/PurchaseCartItem';

export function SupplierPurchaseScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate, routeParams } = useAppNavigation();
  const { products } = useProducts();
  const { profile } = useProfile();
  const { suppliers } = useSuppliers();
  const { items, reload, totalItems, subtotal } = usePurchaseCart();

  const [supplierName, setSupplierName] = useState(routeParams?.supplierName ?? '');
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showQuantityDialog, setShowQuantityDialog] = useState<Product | null>(null);
  const [tempQuantity, setTempQuantity] = useState('1');
  const [generating, setGenerating] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<PurchaseDiscountType>('none');
  const [discountValue, setDiscountValue] = useState('');

  const filteredProducts = useMemo(() => {
    if (!pickerSearch) return products;
    const q = pickerSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)),
    );
  }, [products, pickerSearch]);

  function updateQuantity(productId: string, currentQty: number, delta: number) {
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    void useCases.updatePurchaseCartItem.execute(productId, newQty).then(() => reload());
  }

  function removeItem(productId: string) {
    Alert.alert('Quitar producto', '¿Eliminar este producto del carrito de compra?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => void useCases.removeFromPurchaseCart.execute(productId).then(() => reload()),
      },
    ]);
  }

  function clearCart() {
    Alert.alert('Vaciar carrito', '¿Eliminar todos los productos del carrito de compra?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Vaciar',
        style: 'destructive',
        onPress: () => void useCases.clearPurchaseCart.execute().then(() => reload()),
      },
    ]);
  }

  function openQuantityDialog(product: Product) {
    setShowQuantityDialog(product);
    setTempQuantity('1');
  }

  function confirmQuantity() {
    if (!showQuantityDialog) return;
    const qty = parseInt(tempQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa un número mayor a 0');
      return;
    }
    const product = showQuantityDialog;
    const item: PurchaseCartItem = {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      unitPrice: product.price,
      quantity: qty,
      format: product.format,
      discountType: 'none',
      discountValue: 0,
      subtotal: qty * product.price,
    };
    void useCases.addToPurchaseCart.execute(item).then(() => {
      reload();
      setShowQuantityDialog(null);
    });
  }

  function openDiscountEditor(item: PurchaseCartItem) {
    setEditingDiscount(item.productId);
    setDiscountType(item.discountType);
    setDiscountValue(item.discountValue > 0 ? String(item.discountValue) : '');
  }

  function saveDiscount() {
    if (!editingDiscount) return;
    const val = parseFloat(discountValue) || 0;
    void useCases.updatePurchaseCartItemDiscount.execute(editingDiscount, discountType, val).then(() => {
      reload();
      setEditingDiscount(null);
    });
  }

  async function generatePdf() {
    if (!supplierName.trim()) {
      setError('Ingresa el nombre del proveedor');
      return;
    }
    if (items.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    try {
      setError('');
      setGenerating(true);

      const cartItems = items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        productCode: i.productCode,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        format: i.format,
        discountType: i.discountType as any,
        discountValue: i.discountValue,
        subtotal: i.subtotal,
      }));

      const order = {
        id: `pc_${Date.now()}`,
        orderNumber: 0,
        clientName: supplierName.trim(),
        items: cartItems,
        subtotal,
        iva: 0,
        total: subtotal,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const uri = await useCases.generateOrderPdf.execute(order as any, profile);
      setPdfUri(uri);
      setShowResult(true);

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          await useCases.updateStock.execute(item.productId, product.stock + item.quantity);
        }
      }

      await useCases.clearPurchaseCart.execute();
      await reload();
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

  return (
    <>
      <Screen>
        <Header
          eyebrow="Compra proveedor"
          title="Carrito de compra"
          subtitle={totalItems > 0 ? `${totalItems} productos - ${formatMoney(subtotal)}` : 'Carrito de compra vacío'}
          action={
            items.length > 0 ? (
              <Pressable onPress={clearCart} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </Pressable>
            ) : undefined
          }
        />

        <Card>
          <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Proveedor</AppText>
          {supplierName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 6 }}>
                <Ionicons name="business-outline" size={14} color={colors.primary} />
                <AppText variant="bodySmall" color="accent" style={{ fontWeight: '600' as any }}>{supplierName}</AppText>
              </View>
              <Pressable onPress={() => setSupplierName('')} style={{ padding: 6 }}>
                <Ionicons name="close-circle" size={18} color={colors.error} />
              </Pressable>
            </View>
          ) : null}
          <Pressable
            onPress={() => setShowSupplierPicker(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: colors.surface,
            }}
          >
            <Ionicons name="people-outline" size={18} color={colors.primary} />
            <AppText variant="bodySmall" color={supplierName ? 'primary' : 'muted'}>
              {supplierName ? 'Cambiar proveedor' : 'Seleccionar proveedor...'}
            </AppText>
          </Pressable>
          <TextInput
            placeholder="O escribir nombre manualmente"
            placeholderTextColor={colors.textMuted}
            style={{
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 14,
              fontWeight: '500',
              color: colors.textPrimary,
              marginTop: 8,
            }}
            value={supplierName}
            onChangeText={setSupplierName}
          />
        </Card>

        <PrimaryButton
          label="Agregar productos"
          icon="add-circle-outline"
          onPress={() => setShowProductPicker(true)}
        />

        {items.length === 0 ? (
          <EmptyStateIllustrated
            icon="cart-outline"
            title="Carrito de compra vacío"
            subtitle="Agrega productos desde el selector de productos."
          />
        ) : (
          <>
            {items.map((item) => (
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
                    {item.discountType !== 'none' && item.discountValue > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <View style={{ backgroundColor: colors.success + '18', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <AppText variant="caption" color="success" style={{ fontWeight: '600' } as any}>
                            {item.discountType === 'currency'
                              ? `-${formatMoney(item.discountValue)}`
                              : `-${item.discountValue}%`}
                          </AppText>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                    <Pressable
                      onPress={() => updateQuantity(item.productId, item.quantity, -1)}
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
                      onPress={() => updateQuantity(item.productId, item.quantity, 1)}
                      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </Pressable>
                  </View>

                  <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                    <AppText variant="price" color="accent">{formatMoney(item.subtotal)}</AppText>
                    {item.discountType !== 'none' && item.discountValue > 0 ? (
                      <AppText variant="caption" color="muted" style={{ textDecorationLine: 'line-through' }}>
                        {formatMoney(item.unitPrice * item.quantity)}
                      </AppText>
                    ) : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Pressable onPress={() => openDiscountEditor(item)}>
                        <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => removeItem(item.productId)}>
                        <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
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
        )}
      </Screen>

      {/* Product Picker BottomSheet */}
      <BottomSheet
        visible={showProductPicker}
        onClose={() => { setShowProductPicker(false); setPickerSearch(''); }}
        title="Agregar productos"
      >
        <SearchBar value={pickerSearch} onChange={setPickerSearch} placeholder="Buscar producto..." />
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const inCart = items.some((i) => i.productId === item.id);
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
                  borderColor: inCart ? colors.primary : colors.border,
                  borderWidth: inCart ? 1.5 : 1,
                }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' } as any}>
                      {item.name}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {item.format} · {formatMoney(item.price)}
                    </AppText>
                  </View>
                  {inCart ? (
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
              <PrimaryButton label="Agregar" onPress={confirmQuantity} />
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

      {/* Discount Editor BottomSheet */}
      <BottomSheet
        visible={!!editingDiscount}
        onClose={() => setEditingDiscount(null)}
        title="Editar descuento"
        stickyFooter={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton label="Cancelar" icon="close-outline" onPress={() => setEditingDiscount(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Guardar" icon="checkmark-outline" onPress={saveDiscount} />
            </View>
          </View>
        }
      >
        {editingDiscount ? (
          <View style={{ gap: 12 }}>
            <AppText variant="labelMedium" color="secondary">Tipo de descuento</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['none', 'currency', 'percentage'] as PurchaseDiscountType[]).map((t) => (
                <ChoiceChip
                  key={t}
                  label={t === 'none' ? 'Sin descuento' : t === 'currency' ? 'Monto fijo' : 'Porcentaje'}
                  selected={discountType === t}
                  onPress={() => {
                    setDiscountType(t);
                    if (t === 'none') setDiscountValue('');
                  }}
                />
              ))}
            </View>
            {discountType !== 'none' && (
              <>
                <AppText variant="labelMedium" color="secondary">
                  {discountType === 'currency' ? 'Monto del descuento' : 'Porcentaje de descuento'}
                </AppText>
                <TextInput
                  placeholder={discountType === 'currency' ? 'Ej: 500' : 'Ej: 10'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
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
                  value={discountValue}
                  onChangeText={setDiscountValue}
                />
              </>
            )}
          </View>
        ) : null}
      </BottomSheet>

      {/* Result BottomSheet */}
      <BottomSheet
        visible={showResult}
        onClose={() => setShowResult(false)}
        title="Detalle generado"
        stickyFooter={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton label="Cerrar" icon="close-outline" onPress={() => setShowResult(false)} />
            </View>
            {pdfUri && (
              <View style={{ flex: 1 }}>
                <PrimaryButton label="Compartir PDF" icon="share-social-outline" onPress={sharePdf} />
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
                PDF listo para compartir
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

      {/* Supplier Picker BottomSheet */}
      <BottomSheet
        visible={showSupplierPicker}
        onClose={() => setShowSupplierPicker(false)}
        title="Seleccionar proveedor"
      >
        {suppliers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <AppText variant="bodyMedium" color="muted">No hay proveedores registrados</AppText>
            <AppText variant="caption" color="muted" style={{ marginTop: 4, textAlign: 'center' }}>
              Crea un proveedor desde la pantalla de Proveedores
            </AppText>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {suppliers.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => {
                  setSupplierName(s.name);
                  setShowSupplierPicker(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: 10,
                  backgroundColor: supplierName === s.name ? colors.primarySoft : colors.surface,
                  borderWidth: 1.5,
                  borderColor: supplierName === s.name ? colors.primary : colors.borderDefault,
                }}
              >
                <Ionicons name="business-outline" size={18} color={supplierName === s.name ? colors.primary : colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" color={supplierName === s.name ? 'accent' : 'primary'} style={{ fontWeight: '600' } as any}>
                    {s.name}
                  </AppText>
                  {s.contactName ? (
                    <AppText variant="caption" color="muted">{s.contactName}</AppText>
                  ) : null}
                </View>
                {supplierName === s.name && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
