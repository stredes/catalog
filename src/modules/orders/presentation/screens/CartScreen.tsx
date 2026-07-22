import { useState } from 'react';
import { Alert, Pressable, TextInput, View, ActivityIndicator } from 'react-native';
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
  Divider,
} from '../../../../shared/presentation/components/ui';
import { formatMoney } from '../../../../shared/utils/money';
import { useCart } from '../hooks/useCart';
import { useProfile } from '../../../profile/presentation/hooks/useProfile';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Order } from '../../domain/entities/Order';

export function CartScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { items, reload, totalItems, subtotal, total } = useCart();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');

  function updateQuantity(productId: string, currentQty: number, delta: number) {
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    void useCases.updateCartItem.execute(productId, newQty).then(() => reload());
  }

  function removeItem(productId: string) {
    Alert.alert('Quitar producto', '¿Eliminar este producto del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => void useCases.removeFromCart.execute(productId).then(() => reload()),
      },
    ]);
  }

  function clearCart() {
    Alert.alert('Vaciar carrito', '¿Eliminar todos los productos del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Vaciar',
        style: 'destructive',
        onPress: () => void useCases.clearCart.execute().then(() => reload()),
      },
    ]);
  }

  async function generateOrder() {
    if (!clientName.trim()) {
      setError('Ingresa el nombre del cliente');
      return;
    }
    if (items.length === 0) {
      setError('El carrito esta vacio');
      return;
    }

    try {
      setError('');
      const order = await useCases.generateOrder.execute(clientName.trim(), notes.trim() || undefined);
      setLastOrder(order);
      setPdfUri(null);
      setShowBreakdown(true);
      setClientName('');
      setNotes('');
      await reload();

      try {
        setPdfLoading(true);
        const uri = await useCases.generateOrderPdf.execute(order, profile);
        setPdfUri(uri);
      } catch {
        // PDF generation failed but order was created
      } finally {
        setPdfLoading(false);
      }
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo generar el pedido.',
      );
    }
  }

  async function handleSharePdf() {
    if (!pdfUri || !lastOrder) return;
    try {
      await useCases.shareCatalogPdf.shareFile(pdfUri, `Pedido - ${lastOrder.clientName}`);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo compartir el PDF.',
      );
    }
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Carrito"
          title="Mi carrito"
          subtitle={totalItems > 0 ? `${totalItems} productos - ${formatMoney(total)}` : 'Carrito vacio'}
          action={
            items.length > 0 ? (
              <Pressable onPress={clearCart} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
              </Pressable>
            ) : undefined
          }
        />

        {items.length === 0 ? (
          <EmptyStateIllustrated
            icon="cart-outline"
            title="Carrito vacio"
            subtitle="Agrega productos desde la pantalla de Productos tocando el icono de carrito."
            action={
              <PrimaryButton
                label="Ir a Productos"
                icon="cube-outline"
                onPress={() => navigate('Products')}
              />
            }
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
                <AppText variant="headingSmall" color="accent" style={{ fontWeight: '700' } as any}>{formatMoney(total)}</AppText>
              </View>
            </Card>

            <Card>
              <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 8 }}>Datos del cliente</AppText>
              <TextInput
                placeholder="Nombre del cliente"
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
                  marginBottom: 12,
                }}
                value={clientName}
                onChangeText={setClientName}
              />
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
                  marginBottom: 12,
                }}
                value={notes}
                onChangeText={setNotes}
              />
            </Card>

            {error ? (
              <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' } as any}>{error}</AppText>
            ) : null}

            <PrimaryButton
              label="Generar pedido"
              icon="document-text-outline"
              onPress={generateOrder}
            />
          </>
        )}
      </Screen>

      <BottomSheet
        visible={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        title="Pedido generado"
        stickyFooter={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                label="Cerrar"
                icon="close-outline"
                onPress={() => setShowBreakdown(false)}
              />
            </View>
            {pdfUri && (
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Compartir PDF"
                  icon="share-social-outline"
                  onPress={handleSharePdf}
                />
              </View>
            )}
          </View>
        }
      >
        {lastOrder && (
          <>
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">N° Pedido</AppText>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' } as any}>N° {String(lastOrder.orderNumber).padStart(4, '0')}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">Cliente</AppText>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>{lastOrder.clientName}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">Productos</AppText>
                <AppText variant="bodyMedium" color="primary">{lastOrder.items.length}</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText variant="bodyMedium" color="muted">Subtotal</AppText>
                <AppText variant="bodyMedium" color="primary">{formatMoney(lastOrder.subtotal)}</AppText>
              </View>
              <Divider />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <AppText variant="headingSmall" color="primary">Total</AppText>
                <AppText variant="headingSmall" color="accent" style={{ fontWeight: '700' } as any}>{formatMoney(lastOrder.total)}</AppText>
              </View>
            </Card>

            <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
              {pdfLoading ? (
                <>
                  <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 12 }} />
                  <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>Generando PDF...</AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 4 }}>Preparando tu documento</AppText>
                </>
              ) : pdfUri ? (
                <>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Ionicons name="document-text" size={28} color={colors.success} />
                  </View>
                  <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600', marginBottom: 4 } as any}>PDF listo</AppText>
                  <AppText variant="caption" color="muted" style={{ textAlign: 'center' }}>Toca "Compartir PDF" para enviar el documento</AppText>
                </>
              ) : (
                <>
                  <Ionicons name="alert-circle-outline" size={32} color={colors.error} style={{ marginBottom: 8 }} />
                  <AppText variant="bodyMedium" color="error" style={{ fontWeight: '600' } as any}>No se pudo generar el PDF</AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 4, textAlign: 'center' }}>El pedido se creó pero el PDF no se pudo generar</AppText>
                </>
              )}
            </Card>
          </>
        )}
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
