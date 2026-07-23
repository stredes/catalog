import { useEffect, useState, useCallback } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  Card,
  EmptyStateIllustrated,
  Header,
  PrimaryButton,
  Screen,
  Divider,
} from '../../../../shared/presentation/components/ui';
import { formatMoney } from '../../../../shared/utils/money';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Order } from '../../domain/entities/Order';
import { CartItem, calculateSubtotal } from '../../domain/entities/CartItem';

const EDIT_ORDER_STORAGE_KEY = 'catalog_clean_edit_order_items';
const EDIT_ORDER_CLIENT_KEY = 'catalog_clean_edit_order_client';
const EDIT_ORDER_NOTES_KEY = 'catalog_clean_edit_order_notes';
const EDIT_ORDER_ID_KEY = 'catalog_clean_edit_order_id';

export function EditOrderScreen() {
  const colors = useThemeColors();
  const { useCases, repositories } = useDependencies();
  const { navigate, routeParams } = useAppNavigation();
  const insets = useSafeAreaInsets();
  const orderId = routeParams.orderId;

  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const savedItemsJson = await AsyncStorage.getItem(EDIT_ORDER_STORAGE_KEY);
      const savedOrderId = await AsyncStorage.getItem(EDIT_ORDER_ID_KEY);

      if (savedItemsJson && savedOrderId === orderId) {
        const savedItems: CartItem[] = JSON.parse(savedItemsJson);
        const savedClient = await AsyncStorage.getItem(EDIT_ORDER_CLIENT_KEY);
        const savedNotes = await AsyncStorage.getItem(EDIT_ORDER_NOTES_KEY);
        setItems(savedItems);
        setClientName(savedClient ?? '');
        setNotes(savedNotes ?? '');
        await AsyncStorage.multiRemove([
          EDIT_ORDER_STORAGE_KEY,
          EDIT_ORDER_CLIENT_KEY,
          EDIT_ORDER_NOTES_KEY,
          EDIT_ORDER_ID_KEY,
        ]);
      } else {
        const order = await repositories.orders.findById(orderId);
        if (!order) {
          setError('Pedido no encontrado');
          return;
        }
        setClientName(order.clientName);
        setNotes(order.notes ?? '');
        setItems(order.items);
      }
    } catch {
      setError('Error al cargar el pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId, repositories.orders]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (loading || !orderId) return;
    const interval = setInterval(async () => {
      try {
        const cartJson = await AsyncStorage.getItem('catalog_clean_cart');
        if (!cartJson) return;
        const cartItems: CartItem[] = JSON.parse(cartJson);
        if (cartItems.length === 0) return;
        await AsyncStorage.removeItem('catalog_clean_cart');
        setItems((prev) => {
          const merged = [...prev];
          for (const ci of cartItems) {
            const existing = merged.findIndex((m) => m.productId === ci.productId);
            if (existing >= 0) {
              const old = merged[existing];
              const newQty = old.quantity + ci.quantity;
              merged[existing] = {
                ...old,
                quantity: newQty,
                subtotal: calculateSubtotal(old.unitPrice, newQty, old.discountType, old.discountValue),
              };
            } else {
              merged.push(ci);
            }
          }
          return merged;
        });
      } catch {
        // ignore
      }
    }, 500);
    return () => clearInterval(interval);
  }, [loading, orderId]);

  function updateQuantity(index: number, delta: number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return {
          ...item,
          quantity: newQty,
          subtotal: calculateSubtotal(item.unitPrice, newQty, item.discountType, item.discountValue),
        };
      }),
    );
  }

  function removeItem(index: number) {
    Alert.alert('Quitar producto', '¿Eliminar este producto del pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => setItems((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  }

  async function goToProducts() {
    try {
      await AsyncStorage.setItem(EDIT_ORDER_STORAGE_KEY, JSON.stringify(items));
      await AsyncStorage.setItem(EDIT_ORDER_CLIENT_KEY, clientName);
      await AsyncStorage.setItem(EDIT_ORDER_NOTES_KEY, notes);
      await AsyncStorage.setItem(EDIT_ORDER_ID_KEY, orderId ?? '');
    } catch {
      // storage failed, proceed anyway
    }
    navigate('Products');
  }

  async function saveChanges() {
    if (!clientName.trim()) {
      setError('Ingresa el nombre del cliente');
      return;
    }
    if (items.length === 0) {
      setError('El pedido debe tener al menos un producto');
      return;
    }
    if (!orderId) return;

    try {
      setSaving(true);
      setError('');
      await useCases.updateOrder.execute(orderId, clientName.trim(), items, notes.trim() || undefined);
      navigate('OrderHistory');
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo guardar el pedido.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Header
          eyebrow="Editar"
          title="Cargando pedido..."
          subtitle="Preparando datos"
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AppText variant="bodyMedium" color="muted">Cargando...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Editar"
          title="Editar pedido"
          subtitle={`${items.length} producto${items.length !== 1 ? 's' : ''} - ${formatMoney(subtotal)}`}
          action={
            <Pressable onPress={() => navigate('OrderHistory')} style={{ padding: 8 }}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          }
        />

        {items.length === 0 ? (
          <EmptyStateIllustrated
            icon="cart-outline"
            title="Sin productos"
            subtitle="Agrega productos para editar este pedido."
            action={
              <PrimaryButton
                label="Agregar productos"
                icon="cube-outline"
                onPress={goToProducts}
              />
            }
          />
        ) : (
          <>
            {items.map((item, index) => (
              <Card key={`${item.productId}-${index}`} style={{ marginBottom: 8 }}>
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
                      onPress={() => updateQuantity(index, -1)}
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
                      onPress={() => updateQuantity(index, 1)}
                      style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </Pressable>
                  </View>

                  <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
                    <AppText variant="price" color="accent">{formatMoney(item.subtotal)}</AppText>
                    <Pressable onPress={() => removeItem(index)} style={{ marginTop: 4 }}>
                      <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </Card>
            ))}

            <PrimaryButton
              label="Agregar producto"
              icon="add-circle-outline"
              onPress={goToProducts}
            />

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
              label={saving ? 'Guardando...' : 'Guardar cambios'}
              icon="checkmark-circle-outline"
              onPress={saveChanges}
            />
          </>
        )}
      </Screen>

      <BottomMenu />
    </>
  );
}
