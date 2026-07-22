import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  Card,
  ConfirmDialog,
  EmptyStateIllustrated,
  Header,
  PrimaryButton,
  Screen,
  SearchBar,
  Section,
  ChoiceChip,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { borderRadius, spacing } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';
import { formatDate } from '../../../../shared/utils/dates';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../../domain/entities/Order';

type SortOption = 'newest' | 'name';

export function OrderHistoryScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { orders, reload } = useOrders();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sortedOrders = useMemo(() => {
    let result = [...orders];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.clientName.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q)),
      );
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.clientName.localeCompare(b.clientName));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [orders, search, sortBy]);

  async function shareOrder(order: Order) {
    try {
      setError('');
      const profile = await useCases.getProfile.execute();
      const uri = await useCases.generateOrderPdf.execute(order, profile);
      await useCases.shareCatalogPdf.shareFile(uri, `Pedido - ${order.clientName}`);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo compartir el pedido.',
      );
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  async function executeDelete() {
    if (!deleteId) return;
    await useCases.deleteOrder.execute(deleteId);
    setDeleteId(null);
    await reload();
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Pedidos"
          title="Historial de pedidos"
          subtitle={
            orders.length > 0
              ? `${orders.length} pedido${orders.length !== 1 ? 's' : ''}`
              : 'Tus pedidos aparecerán aquí'
          }
          action={
            <Pressable onPress={() => navigate('Cart')} style={{ padding: 8 }}>
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
            </Pressable>
          }
        />

        {orders.length > 0 ? (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o producto..." />

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <ChoiceChip
                label="Más recientes"
                selected={sortBy === 'newest'}
                onPress={() => setSortBy('newest')}
                color={colors.textSecondary}
              />
              <ChoiceChip
                label="Cliente"
                selected={sortBy === 'name'}
                onPress={() => setSortBy('name')}
                color={colors.textSecondary}
              />
            </View>
          </>
        ) : null}

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any }}>
            {error}
          </AppText>
        ) : null}

        {sortedOrders.length === 0 ? (
          <EmptyStateIllustrated
            icon="receipt-outline"
            title={orders.length === 0 ? 'Sin pedidos' : 'Sin resultados'}
            subtitle={
              orders.length === 0
                ? 'Crea tu primer pedido desde el carrito para verlo aquí.'
                : 'Ningún pedido coincide con tu búsqueda.'
            }
            action={
              orders.length === 0 ? (
                <PrimaryButton
                  label="Ir al carrito"
                  icon="cart-outline"
                  onPress={() => navigate('Cart')}
                />
              ) : undefined
            }
          />
        ) : (
          <Section title={`${sortedOrders.length} resultado${sortedOrders.length !== 1 ? 's' : ''}`}>
            {sortedOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

              return (
                <Card key={order.id} style={{ marginBottom: 8 }}>
                  <Pressable onPress={() => toggleExpand(order.id)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={[
                          styles.orderIcon,
                          { backgroundColor: colors.primarySoft },
                        ]}
                      >
                        <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText
                          variant="bodyMedium"
                          color="primary"
                          numberOfLines={1}
                          style={{ fontWeight: '600' as any }}
                        >
                          N° {String(order.orderNumber).padStart(4, '0')} - {order.clientName}
                        </AppText>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                          <AppText variant="caption" color="muted">
                            {formatDate(order.createdAt)}
                          </AppText>
                          <AppText variant="caption" color="muted">
                            ·
                          </AppText>
                          <AppText variant="caption" color="muted">
                            {totalItems} producto{totalItems !== 1 ? 's' : ''}
                          </AppText>
                        </View>
                      </View>
                      <AppText
                        variant="bodyMedium"
                        color="primary"
                        style={{ fontWeight: '700' as any }}
                      >
                        {formatMoney(order.total)}
                      </AppText>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {order.items.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <AppText variant="bodySmall" color="primary" numberOfLines={1}>
                              {item.productName}
                            </AppText>
                            <AppText variant="caption" color="muted">
                              {item.quantity} x {formatMoney(item.unitPrice)}
                              {item.productCode ? ` · Cod: ${item.productCode}` : ''}
                            </AppText>
                          </View>
                          <AppText variant="bodySmall" color="primary" style={{ fontWeight: '600' as any }}>
                            {formatMoney(item.subtotal)}
                          </AppText>
                        </View>
                      ))}

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      <View style={styles.totalRow}>
                        <AppText variant="bodySmall" color="muted">Total</AppText>
                        <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any }}>
                          {formatMoney(order.total)}
                        </AppText>
                      </View>

                      {order.notes ? (
                        <AppText variant="caption" color="muted" style={{ marginTop: 6 }}>
                          Notas: {order.notes}
                        </AppText>
                      ) : null}

                      <View style={styles.actionRow}>
                        <Pressable
                          onPress={() => navigate('EditOrder', { orderId: order.id })}
                          style={[styles.actionButton, { backgroundColor: colors.primarySoft }]}
                        >
                          <Ionicons name="create-outline" size={16} color={colors.primary} />
                          <AppText variant="caption" color="accent">Editar</AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => shareOrder(order)}
                          style={[styles.actionButton, { backgroundColor: colors.primarySoft }]}
                        >
                          <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                          <AppText variant="caption" color="accent">Compartir</AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(order.id)}
                          style={[styles.actionButton, { backgroundColor: colors.errorLight }]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <AppText variant="caption" color="error">Eliminar</AppText>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </Section>
        )}
      </Screen>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar pedido"
        message="Se eliminará del historial. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

      <BottomMenu />
    </>
  );
}

const styles = {
  orderIcon: {
    alignItems: 'center' as const,
    borderRadius: borderRadius.medium,
    height: 36,
    justifyContent: 'center' as const,
    width: 36,
  },
  expandedContent: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 4,
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  actionRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
  },
};
