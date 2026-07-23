import { useMemo, useState } from 'react';
import { Alert, Pressable, TextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  BottomSheet,
  Card,
  ConfirmDialog,
  EmptyStateIllustrated,
  Header,
  PrimaryButton,
  Screen,
  SearchBar,
  Section,
  ChoiceChip,
  SecondaryButton,
  Divider,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { borderRadius, shadows, spacing } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';
import { formatDate } from '../../../../shared/utils/dates';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../../domain/entities/Order';

type SortOption = 'newest' | 'name';
type StatusFilter = 'all' | 'pending' | 'partial' | 'paid';
type ViewMode = 'list' | 'calendar';

const WEEK_DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function OrderHistoryScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { orders, reload } = useOrders();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showDayOrders, setShowDayOrders] = useState(false);

  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const order of orders) {
      const key = toDateKey(new Date(order.createdAt));
      if (!map[key]) map[key] = [];
      map[key].push(order);
    }
    return map;
  }, [orders]);

  const selectedDayOrders = useMemo(() => {
    if (!selectedDay) return [];
    return ordersByDate[selectedDay] ?? [];
  }, [selectedDay, ordersByDate]);

  const sortedOrders = useMemo(() => {
    let result = [...orders];

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.clientName.toLowerCase().includes(q) ||
          String(o.orderNumber).includes(q) ||
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
  }, [orders, search, sortBy, statusFilter]);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const partialCount = orders.filter((o) => o.status === 'partial').length;
  const paidCount = orders.filter((o) => o.status === 'paid').length;

  const calDaysInMonth = getDaysInMonth(calYear, calMonth);
  const calFirstDay = getFirstDayOfMonth(calYear, calMonth);

  const monthOrderCount = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= calDaysInMonth; d++) {
      const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (ordersByDate[key]) count += ordersByDate[key]!.length;
    }
    return count;
  }, [calYear, calMonth, calDaysInMonth, ordersByDate]);

  const monthRevenue = useMemo(() => {
    let total = 0;
    for (let d = 1; d <= calDaysInMonth; d++) {
      const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOrders = ordersByDate[key];
      if (dayOrders) {
        for (const o of dayOrders) total += o.total;
      }
    }
    return total;
  }, [calYear, calMonth, calDaysInMonth, ordersByDate]);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
    setSelectedDay(null);
  }

  function selectDay(day: number) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!ordersByDate[key]) return;
    setSelectedDay(key);
    setShowDayOrders(true);
  }

  async function toggleOrderStatus(order: Order) {
    try {
      setError('');
      await useCases.toggleOrderStatus.execute(order.id);
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo cambiar el estado.',
      );
    }
  }

  function confirmToggleStatus(order: Order) {
    const newLabel = order.status === 'paid' ? 'pendiente' : 'pagado';
    Alert.alert(
      'Cambiar estado',
      `Marcar pedido N° ${String(order.orderNumber).padStart(4, '0')} como "${newLabel}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void toggleOrderStatus(order) },
      ],
    );
  }

  function openPayment(order: Order) {
    const pending = order.total - (order.paidAmount ?? 0);
    setPaymentOrderId(order.id);
    setPaymentAmount(pending > 0 ? String(Math.floor(pending)) : '');
  }

  async function confirmPayment() {
    if (!paymentOrderId) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Ingresa un monto valido');
      return;
    }
    try {
      setError('');
      await useCases.recordPayment.execute(paymentOrderId, amount);
      setPaymentOrderId(null);
      setPaymentAmount('');
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo registrar el pago.',
      );
    }
  }

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
              ? `${orders.length} pedido${orders.length !== 1 ? 's' : ''} · ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`
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
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <ChoiceChip
                label=" Lista"
                selected={viewMode === 'list'}
                onPress={() => setViewMode('list')}
                color={colors.primary}
              />
              <ChoiceChip
                label=" Calendario"
                selected={viewMode === 'calendar'}
                onPress={() => setViewMode('calendar')}
                color={colors.primary}
              />
            </View>

            {viewMode === 'list' ? (
              <>
                <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o producto..." />

                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                  <ChoiceChip
                    label={`Todos (${orders.length})`}
                    selected={statusFilter === 'all'}
                    onPress={() => setStatusFilter('all')}
                    color={colors.textSecondary}
                  />
                  <ChoiceChip
                    label={`Pendientes (${pendingCount})`}
                    selected={statusFilter === 'pending'}
                    onPress={() => setStatusFilter('pending')}
                    color={colors.warning}
                  />
                  {partialCount > 0 ? (
                    <ChoiceChip
                      label={`Parcial (${partialCount})`}
                      selected={statusFilter === 'partial'}
                      onPress={() => setStatusFilter('partial')}
                      color={colors.info}
                    />
                  ) : null}
                  <ChoiceChip
                    label={`Pagados (${paidCount})`}
                    selected={statusFilter === 'paid'}
                    onPress={() => setStatusFilter('paid')}
                    color={colors.success}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  <ChoiceChip
                    label="Mas recientes"
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
          </>
        ) : null}

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any }}>
            {error}
          </AppText>
        ) : null}

        {orders.length === 0 ? (
          <EmptyStateIllustrated
            icon="receipt-outline"
            title="Sin pedidos"
            subtitle="Crea tu primer pedido desde el carrito para verlo aqui."
            action={
              <PrimaryButton
                label="Ir al carrito"
                icon="cart-outline"
                onPress={() => navigate('Cart')}
              />
            }
          />
        ) : viewMode === 'calendar' ? (
          <>
            <Card variant="elevated" style={{ padding: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <Pressable
                  onPress={prevMonth}
                  style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
                  accessibilityLabel="Mes anterior"
                >
                  <Ionicons name="chevron-back" size={22} color={colors.primary} />
                </Pressable>
                <View style={{ alignItems: 'center' }}>
                  <AppText variant="heading3" color="primary">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </AppText>
                  <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
                    {monthOrderCount} pedido{monthOrderCount !== 1 ? 's' : ''} · {formatMoney(monthRevenue)}
                  </AppText>
                </View>
                <Pressable
                  onPress={nextMonth}
                  style={({ pressed }) => [{ padding: 8, opacity: pressed ? 0.6 : 1 }]}
                  accessibilityLabel="Mes siguiente"
                >
                  <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: spacing.xs }}>
                {WEEK_DAYS.map((day) => (
                  <View key={day} style={styles.calDayHeader}>
                    <AppText variant="caption" color="muted" style={{ fontWeight: '700' as any, fontSize: 11 }}>
                      {day}
                    </AppText>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: calFirstDay }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.calDayCell} />
                ))}
                {Array.from({ length: calDaysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hasOrders = !!ordersByDate[key];
                  const orderCount = ordersByDate[key]?.length ?? 0;
                  const isSelected = selectedDay === key;
                  const isToday = toDateKey(new Date()) === key;

                  return (
                    <Pressable
                      key={day}
                      onPress={() => selectDay(day)}
                      disabled={!hasOrders}
                      style={({ pressed }) => [
                        styles.calDayCell,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : hasOrders
                              ? colors.warning + '28'
                              : 'transparent',
                          borderColor: isToday ? colors.primary : hasOrders ? colors.warning + '50' : colors.border + '40',
                          borderWidth: isToday ? 2 : 1,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <AppText
                        variant="bodySmall"
                        color={isSelected ? 'inverse' : hasOrders ? 'primary' : 'muted'}
                        style={{
                          fontWeight: (isToday || hasOrders) ? '700' as any : '400' as any,
                          fontSize: 13,
                        }}
                      >
                        {day}
                      </AppText>
                      {hasOrders ? (
                        <View style={[styles.calDot, { backgroundColor: isSelected ? '#FFFFFF' : colors.warning }]} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {selectedDay ? (
              <Section title={`Pedidos del ${new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })} (${selectedDayOrders.length})`}>
                {selectedDayOrders.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
                  const isPaid = order.status === 'paid';
                  const isPartial = order.status === 'partial';
                  const paidAmount = order.paidAmount ?? 0;
                  const pendingAmount = order.total - paidAmount;
                  const progress = order.total > 0 ? paidAmount / order.total : 0;

                  return (
                    <Card key={order.id} style={{ marginBottom: 8 }}>
                      <Pressable onPress={() => toggleExpand(order.id)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View
                            style={[
                              styles.orderIcon,
                              { backgroundColor: isPaid ? colors.success + '18' : isPartial ? colors.info + '18' : colors.warning + '18' },
                            ]}
                          >
                            <Ionicons
                              name={isPaid ? 'checkmark-circle-outline' : isPartial ? 'swap-horizontal-outline' : 'time-outline'}
                              size={18}
                              color={isPaid ? colors.success : isPartial ? colors.info : colors.warning}
                            />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' as any }}>
                                N° {String(order.orderNumber).padStart(4, '0')} - {order.clientName}
                              </AppText>
                              <View style={{
                                backgroundColor: isPaid ? colors.success + '18' : isPartial ? colors.info + '18' : colors.warning + '18',
                                borderRadius: 8,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                              }}>
                                <AppText variant="caption" color={isPaid ? 'success' : isPartial ? 'info' : 'warning'} style={{ fontWeight: '700' as any, fontSize: 10 }}>
                                  {isPaid ? 'PAGADO' : isPartial ? 'PARCIAL' : 'PENDIENTE'}
                                </AppText>
                              </View>
                            </View>
                            <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
                              {totalItems} producto{totalItems !== 1 ? 's' : ''}
                            </AppText>
                          </View>
                          <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center' }}>
                            <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any, minWidth: 80, textAlign: 'right' as any }}>
                              {formatMoney(order.total)}
                            </AppText>
                          </View>
                        </View>
                        {!isPaid && paidAmount > 0 ? (
                          <View style={{ marginTop: 8 }}>
                            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
                              <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.info, borderRadius: 2 }} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                              <AppText variant="caption" color="info">{formatMoney(paidAmount)} pagado</AppText>
                              <AppText variant="caption" color="muted">{formatMoney(pendingAmount)} restante</AppText>
                            </View>
                          </View>
                        ) : null}
                      </Pressable>

                      {isExpanded ? (
                        <View style={styles.expandedContent}>
                          <View style={[styles.divider, { backgroundColor: colors.border }]} />
                          {order.items.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <AppText variant="bodySmall" color="primary" numberOfLines={1}>{item.productName}</AppText>
                                <AppText variant="caption" color="muted">
                                  {item.quantity} x {formatMoney(item.unitPrice)}
                                </AppText>
                              </View>
                              <AppText variant="bodySmall" color="primary" style={{ fontWeight: '600' as any, flexShrink: 0 }}>
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
                          <View style={styles.actionRow}>
                            {!isPaid ? (
                              <Pressable
                                onPress={() => openPayment(order)}
                                style={[styles.actionButton, { backgroundColor: colors.info + '18' }]}
                              >
                                <Ionicons name="cash-outline" size={16} color={colors.info} />
                                <AppText variant="caption" color="info">Pago</AppText>
                              </Pressable>
                            ) : null}
                            <Pressable
                              onPress={() => confirmToggleStatus(order)}
                              style={[styles.actionButton, { backgroundColor: isPaid ? colors.warning + '18' : colors.success + '18' }]}
                            >
                              <Ionicons name={isPaid ? 'arrow-undo-outline' : 'checkmark-circle-outline'} size={16} color={isPaid ? colors.warning : colors.success} />
                              <AppText variant="caption" color={isPaid ? 'warning' : 'success'}>
                                {isPaid ? 'Pendiente' : 'Pagado'}
                              </AppText>
                            </Pressable>
                            <Pressable
                              onPress={() => shareOrder(order)}
                              style={[styles.actionButton, { backgroundColor: colors.primarySoft }]}
                            >
                              <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                              <AppText variant="caption" color="accent">Compartir</AppText>
                            </Pressable>
                          </View>
                        </View>
                      ) : null}
                    </Card>
                  );
                })}
              </Section>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
                <Ionicons name="calendar-outline" size={40} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
                <AppText variant="bodyMedium" color="muted" style={{ textAlign: 'center' }}>
                  Toca un dia marcado en amarillo para ver los pedidos
                </AppText>
              </View>
            )}
          </>
        ) : (
          sortedOrders.length === 0 ? (
            <EmptyStateIllustrated
              icon="receipt-outline"
              title="Sin resultados"
              subtitle="Ningun pedido coincide con tu busqueda."
            />
          ) : (
            <Section title={`${sortedOrders.length} resultado${sortedOrders.length !== 1 ? 's' : ''}`}>
              {sortedOrders.map((order) => {
                const isExpanded = expandedId === order.id;
                const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const isPaid = order.status === 'paid';
                const isPartial = order.status === 'partial';
                const paidAmount = order.paidAmount ?? 0;
                const pendingAmount = order.total - paidAmount;
                const progress = order.total > 0 ? paidAmount / order.total : 0;

                return (
                  <Card key={order.id} style={{ marginBottom: 8 }}>
                    <Pressable onPress={() => toggleExpand(order.id)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View
                          style={[
                            styles.orderIcon,
                            { backgroundColor: isPaid ? colors.success + '18' : isPartial ? colors.info + '18' : colors.warning + '18' },
                          ]}
                        >
                          <Ionicons
                            name={isPaid ? 'checkmark-circle-outline' : isPartial ? 'swap-horizontal-outline' : 'time-outline'}
                            size={18}
                            color={isPaid ? colors.success : isPartial ? colors.info : colors.warning}
                          />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' as any }}>
                              N° {String(order.orderNumber).padStart(4, '0')} - {order.clientName}
                            </AppText>
                            <View style={{
                              backgroundColor: isPaid ? colors.success + '18' : isPartial ? colors.info + '18' : colors.warning + '18',
                              borderRadius: 8,
                              paddingHorizontal: 6,
                              paddingVertical: 1,
                            }}>
                              <AppText variant="caption" color={isPaid ? 'success' : isPartial ? 'info' : 'warning'} style={{ fontWeight: '700' as any, fontSize: 10 }}>
                                {isPaid ? 'PAGADO' : isPartial ? 'PARCIAL' : 'PENDIENTE'}
                              </AppText>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                            <AppText variant="caption" color="muted">{formatDate(order.createdAt)}</AppText>
                            <AppText variant="caption" color="muted">·</AppText>
                            <AppText variant="caption" color="muted">
                              {totalItems} producto{totalItems !== 1 ? 's' : ''}
                            </AppText>
                          </View>
                        </View>
                        <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any, minWidth: 80, textAlign: 'right' as any }}>
                            {formatMoney(order.total)}
                          </AppText>
                          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                        </View>
                      </View>
                      {!isPaid && paidAmount > 0 ? (
                        <View style={{ marginTop: 8 }}>
                          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
                            <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: colors.info, borderRadius: 2 }} />
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                            <AppText variant="caption" color="info">{formatMoney(paidAmount)} pagado</AppText>
                            <AppText variant="caption" color="muted">{formatMoney(pendingAmount)} restante</AppText>
                          </View>
                        </View>
                      ) : null}
                    </Pressable>

                    {isExpanded ? (
                      <View style={styles.expandedContent}>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        {order.items.map((item, idx) => (
                          <View key={idx} style={styles.itemRow}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <AppText variant="bodySmall" color="primary" numberOfLines={1}>{item.productName}</AppText>
                              <AppText variant="caption" color="muted">
                                {item.quantity} x {formatMoney(item.unitPrice)}
                                {item.productCode ? ` · Cod: ${item.productCode}` : ''}
                              </AppText>
                            </View>
                            <AppText variant="bodySmall" color="primary" style={{ fontWeight: '600' as any, flexShrink: 0 }}>
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
                          <AppText variant="caption" color="muted" style={{ marginTop: 6 }}>Notas: {order.notes}</AppText>
                        ) : null}
                        <View style={styles.actionRow}>
                          {!isPaid ? (
                            <Pressable
                              onPress={() => openPayment(order)}
                              style={[styles.actionButton, { backgroundColor: colors.info + '18' }]}
                            >
                              <Ionicons name="cash-outline" size={16} color={colors.info} />
                              <AppText variant="caption" color="info">Pago</AppText>
                            </Pressable>
                          ) : null}
                          <Pressable
                            onPress={() => confirmToggleStatus(order)}
                            style={[styles.actionButton, { backgroundColor: isPaid ? colors.warning + '18' : colors.success + '18' }]}
                          >
                            <Ionicons name={isPaid ? 'arrow-undo-outline' : 'checkmark-circle-outline'} size={16} color={isPaid ? colors.warning : colors.success} />
                            <AppText variant="caption" color={isPaid ? 'warning' : 'success'}>
                              {isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                            </AppText>
                          </Pressable>
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
          )
        )}
      </Screen>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar pedido"
        message="Se eliminara del historial. Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

      <BottomSheet
        visible={!!paymentOrderId}
        onClose={() => { setPaymentOrderId(null); setPaymentAmount(''); }}
        title="Registrar pago"
        stickyFooter={
          <PrimaryButton
            label="Registrar pago"
            icon="cash-outline"
            onPress={confirmPayment}
          />
        }
      >
        {paymentOrderId ? (() => {
          const order = orders.find((o) => o.id === paymentOrderId);
          if (!order) return null;
          const paidAmount = order.paidAmount ?? 0;
          const pending = order.total - paidAmount;
          return (
            <View style={{ gap: 12 }}>
              <Card style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodySmall" color="muted">Total del pedido</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ fontWeight: '600' as any }}>{formatMoney(order.total)}</AppText>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodySmall" color="muted">Ya pagado</AppText>
                  <AppText variant="bodySmall" color="info" style={{ fontWeight: '600' as any }}>{formatMoney(paidAmount)}</AppText>
                </View>
                <Divider />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="bodySmall" color="muted">Pendiente</AppText>
                  <AppText variant="bodySmall" color="warning" style={{ fontWeight: '700' as any }}>{formatMoney(pending)}</AppText>
                </View>
              </Card>
              <AppText variant="labelMedium" color="secondary">Monto a pagar</AppText>
              <TextInput
                placeholder={`Maximo: ${formatMoney(pending)}`}
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={{
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: colors.borderDefault,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 18,
                  fontWeight: '600',
                  color: colors.textPrimary,
                }}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setPaymentAmount(String(Math.floor(pending)))}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center' }}
                >
                  <AppText variant="caption" color="accent" style={{ fontWeight: '600' as any }}>Total</AppText>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentAmount(String(Math.floor(pending / 2)))}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center' }}
                >
                  <AppText variant="caption" color="accent" style={{ fontWeight: '600' as any }}>Mitad</AppText>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentAmount(String(Math.floor(pending / 3)))}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: 'center' }}
                >
                  <AppText variant="caption" color="accent" style={{ fontWeight: '600' as any }}>1/3</AppText>
                </Pressable>
              </View>
            </View>
          );
        })() : null}
      </BottomSheet>

      <BottomMenu />
    </>
  );
}

const styles = StyleSheet.create({
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
    flexWrap: 'wrap' as const,
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
  calDayHeader: {
    width: '14.28%',
    alignItems: 'center' as const,
    paddingVertical: 4,
  },
  calDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: borderRadius.medium,
    marginVertical: 1,
  },
  calDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});
