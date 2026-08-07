import { useMemo, useState } from 'react';
import { FlatList, LayoutAnimation, Platform, Pressable, StyleSheet, TextInput, UIManager, View } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  BottomSheet,
  Card,
  ChoiceChip,
  ConfirmDialog,
  Divider,
  EmptyStateIllustrated,
  Header,
  PrimaryButton,
  Screen,
  SearchBar,
  SecondaryButton,
} from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { borderRadius, spacing } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';
import { Invoice, InvoiceStatus } from '../../domain/entities/Invoice';
import { InvoiceHistoryEntry } from '../../domain/repositories/RecordHistoryRepository';
import { InvoiceInputDto } from '../../application/dtos/InvoiceDtos';
import { useInvoices } from '../hooks/useInvoices';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SortOption = 'newest' | 'number' | 'highest';
type StatusFilter = 'all' | InvoiceStatus;

const statusColors: Record<InvoiceStatus, string> = {
  pending: 'warning',
  paid: 'success',
};

const statusLabels: Record<InvoiceStatus, string> = {
  pending: 'PENDIENTE',
  paid: 'PAGADA',
};

const historyLabels: Record<InvoiceHistoryEntry['action'], string> = {
  created: 'Factura creada',
  updated: 'Factura actualizada',
  deleted: 'Factura eliminada',
  imported: 'Factura importada',
};

const ACCORDION_CONFIG = {
  duration: 280,
  create: { type: 'easeInEaseOut' as const, property: 'opacity' as const },
  update: { type: 'easeInEaseOut' as const },
  delete: { type: 'easeInEaseOut' as const, property: 'opacity' as const },
};

export function InvoicesScreen() {
  const colors = useThemeColors();
  const { useCases, repositories } = useDependencies();
  const { invoices, loading, reload } = useInvoices();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const [historyEntries, setHistoryEntries] = useState<InvoiceHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [editing, setEditing] = useState<Invoice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState('');
  const [formClientName, setFormClientName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNetAmount, setFormNetAmount] = useState('');
  const [formStatus, setFormStatus] = useState<InvoiceStatus>('pending');
  const [formPaymentDate, setFormPaymentDate] = useState('');

  const sortedInvoices = useMemo(() => {
    let result = [...invoices];

    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.clientName.toLowerCase().includes(q) ||
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.description ?? '').toLowerCase().includes(q),
      );
    }

    switch (sortBy) {
      case 'number':
        result.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true }));
        break;
      case 'highest':
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
        break;
    }

    return result;
  }, [invoices, search, sortBy, statusFilter]);

  const pendingCount = useMemo(() => invoices.filter((inv) => inv.status === 'pending').length, [invoices]);
  const paidCount = useMemo(() => invoices.filter((inv) => inv.status === 'paid').length, [invoices]);

  function toggleExpand(id: string) {
    LayoutAnimation.configureNext(ACCORDION_CONFIG);
    setExpandedId(expandedId === id ? null : id);
  }

  function resetForm() {
    setFormInvoiceNumber('');
    setFormInvoiceDate('');
    setFormClientName('');
    setFormDescription('');
    setFormNetAmount('');
    setFormStatus('pending');
    setFormPaymentDate('');
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setShowForm(true);
  }

  function startEdit(invoice: Invoice) {
    setEditing(invoice);
    setFormInvoiceNumber(invoice.invoiceNumber);
    setFormInvoiceDate(invoice.invoiceDate);
    setFormClientName(invoice.clientName);
    setFormDescription(invoice.description ?? '');
    setFormNetAmount(String(invoice.netAmount));
    setFormStatus(invoice.status);
    setFormPaymentDate(invoice.paymentDate ?? '');
    setShowForm(true);
  }

  async function submit() {
    const netAmount = Number(formNetAmount.replace(/\./g, '').replace(/,/g, '.'));

    const input: InvoiceInputDto = {
      invoiceNumber: formInvoiceNumber.trim(),
      invoiceDate: formInvoiceDate.trim(),
      clientName: formClientName.trim(),
      description: formDescription.trim() || undefined,
      netAmount,
      status: formStatus,
      paymentDate: formStatus === 'paid' ? formPaymentDate.trim() : undefined,
    };

    try {
      setError('');
      if (editing) {
        await useCases.updateInvoice.execute(editing.id, input);
      } else {
        await useCases.createInvoice.execute(input);
      }

      setEditing(null);
      setShowForm(false);
      resetForm();
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo guardar la factura.',
      );
    }
  }

  async function changeStatus(invoice: Invoice, newStatus: InvoiceStatus) {
    try {
      setError('');
      await useCases.updateInvoiceStatus.execute(invoice.id, newStatus);
      setStatusMenuId(null);
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo cambiar el estado.',
      );
    }
  }

  async function executeDelete() {
    if (!deleteId) return;
    try {
      await useCases.deleteInvoice.execute(deleteId);
      setDeleteId(null);
      setExpandedId(null);
      await reload();
    } catch (currentError) {
      setDeleteId(null);
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo eliminar la factura.',
      );
    }
  }

  async function openHistory(invoice: Invoice) {
    setHistoryInvoice(invoice);
    setHistoryEntries([]);
    setHistoryLoading(true);
    try {
      const entries = await repositories.recordHistory.findByEntity(invoice.id);
      setHistoryEntries(entries);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo cargar el historial.',
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  function renderHeader() {
    return (
      <View>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por numero, cliente o descripcion..." />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ key: 'all' }, { key: 'pending' }, { key: 'paid' }]}
          contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}
          decelerationRate="fast"
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            const filters: Record<string, { label: string; status: StatusFilter; color: string }> = {
              all: { label: `Todos (${invoices.length})`, status: 'all', color: colors.textSecondary },
              pending: { label: `Pendientes (${pendingCount})`, status: 'pending', color: colors.warning },
              paid: { label: `Pagadas (${paidCount})`, status: 'paid', color: colors.success },
            };
            const f = filters[item.key];
            return (
              <ChoiceChip
                label={f.label}
                selected={statusFilter === f.status}
                onPress={() => setStatusFilter(f.status)}
                color={f.color}
              />
            );
          }}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ key: 'newest', label: 'Por fecha' }, { key: 'number', label: 'Por numero' }, { key: 'highest', label: 'Mayor monto' }]}
          contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}
          decelerationRate="fast"
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <ChoiceChip
              label={item.label}
              selected={sortBy === item.key}
              onPress={() => setSortBy(item.key as SortOption)}
              color={colors.textSecondary}
            />
          )}
        />

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any, marginBottom: 8 }}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  }

  function renderInvoiceCard({ item: invoice }: { item: Invoice }) {
    const isExpanded = expandedId === invoice.id;
    const sc = statusColors[invoice.status] ?? 'warning';
    const sl = statusLabels[invoice.status] ?? 'PENDIENTE';

    return (
      <Card>
        <Pressable onPress={() => toggleExpand(invoice.id)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.invoiceIcon, { backgroundColor: colors[sc as keyof typeof colors] + '18' }]}>
              <Ionicons name="receipt-outline" size={18} color={colors[sc as keyof typeof colors]} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' as any }}>
                  N° {invoice.invoiceNumber} - {invoice.clientName}
                </AppText>
                <View style={{ backgroundColor: colors[sc as keyof typeof colors] + '18', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <AppText variant="caption" color={sc as any} style={{ fontWeight: '700' as any, fontSize: 10 }}>
                    {sl}
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
                {new Date(invoice.invoiceDate).toLocaleDateString('es-CL')}
              </AppText>
            </View>
            <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any, minWidth: 80, textAlign: 'right' as any }}>
                {formatMoney(invoice.totalAmount)}
              </AppText>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </View>
          </View>
        </Pressable>

        {isExpanded ? (
          <View style={styles.expandedContent}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 6 }}>Detalle</AppText>
            <View style={styles.itemRow}>
              <AppText variant="caption" color="muted">Numero</AppText>
              <AppText variant="bodySmall" color="primary" style={{ fontWeight: '600' as any }}>N° {invoice.invoiceNumber}</AppText>
            </View>
            <View style={styles.itemRow}>
              <AppText variant="caption" color="muted">Fecha factura</AppText>
              <AppText variant="bodySmall" color="primary">{new Date(invoice.invoiceDate).toLocaleDateString('es-CL')}</AppText>
            </View>
            <View style={styles.itemRow}>
              <AppText variant="caption" color="muted">Cliente</AppText>
              <AppText variant="bodySmall" color="primary">{invoice.clientName}</AppText>
            </View>
            {invoice.paymentDate ? (
              <View style={styles.itemRow}>
                <AppText variant="caption" color="muted">Fecha de pago</AppText>
                <AppText variant="bodySmall" color="primary">{new Date(invoice.paymentDate).toLocaleDateString('es-CL')}</AppText>
              </View>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 6 }}>Totales</AppText>
            <View style={styles.itemRow}>
              <AppText variant="bodySmall" color="muted">Precio Neto</AppText>
              <AppText variant="bodySmall" color="primary">{formatMoney(invoice.netAmount)}</AppText>
            </View>
            <View style={styles.itemRow}>
              <AppText variant="bodySmall" color="muted">IVA (19%)</AppText>
              <AppText variant="bodySmall" color="primary">{formatMoney(invoice.taxAmount)}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText variant="bodySmall" color="muted">Total</AppText>
              <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any }}>
                {formatMoney(invoice.totalAmount)}
              </AppText>
            </View>

            {invoice.description ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 4 }}>Descripcion</AppText>
                <AppText variant="caption" color="muted">{invoice.description}</AppText>
              </>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => startEdit(invoice)}
                style={[styles.actionButton, { backgroundColor: colors.primarySoft }]}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <AppText variant="caption" color="accent">Editar</AppText>
              </Pressable>
              <Pressable
                onPress={() => setStatusMenuId(invoice.id)}
                style={[styles.actionButton, { backgroundColor: colors[sc as keyof typeof colors] + '18' }]}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color={colors[sc as keyof typeof colors]} />
                <AppText variant="caption" color={sc as any}>Estado</AppText>
              </Pressable>
              <Pressable
                onPress={() => openHistory(invoice)}
                style={[styles.actionButton, { backgroundColor: colors.info + '18' }]}
              >
                <Ionicons name="time-outline" size={16} color={colors.info} />
                <AppText variant="caption" color="info">Historial</AppText>
              </Pressable>
              <Pressable
                onPress={() => setDeleteId(invoice.id)}
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
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Facturas"
          title="Gestion de facturas"
          subtitle={
            invoices.length > 0
              ? `${sortedInvoices.length} de ${invoices.length} factura${invoices.length !== 1 ? 's' : ''}`
              : 'Registra tus facturas y controla sus estados'
          }
          action={
            <Pressable onPress={openCreate} style={{ padding: 8 }}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            </Pressable>
          }
        />

        {loading ? (
          <Card>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <AppText variant="bodySmall" color="muted">Cargando facturas...</AppText>
            </View>
          </Card>
        ) : invoices.length === 0 ? (
          <EmptyStateIllustrated
            icon="receipt-outline"
            title="Sin facturas"
            subtitle="Crea tu primera factura para llevar el control de montos e IVA."
            action={
              <PrimaryButton
                label="Crear factura"
                icon="add-circle-outline"
                onPress={openCreate}
              />
            }
          />
        ) : sortedInvoices.length === 0 ? (
          <EmptyStateIllustrated
            icon="receipt-outline"
            title="Sin resultados"
            subtitle="Ninguna factura coincide con tu busqueda."
          />
        ) : (
          <FlatList
            data={sortedInvoices}
            keyExtractor={(item) => item.id}
            renderItem={renderInvoiceCard}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
          />
        )}
      </Screen>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar factura"
        message="Esta accion no se puede deshacer. El historial de la factura se conservara."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

      <BottomSheet
        visible={!!statusMenuId}
        onClose={() => setStatusMenuId(null)}
        title="Cambiar estado"
      >
        {statusMenuId ? (() => {
          const invoice = invoices.find((inv) => inv.id === statusMenuId);
          if (!invoice) return null;
          const statuses: InvoiceStatus[] = ['pending', 'paid'];
          return (
            <View style={{ gap: 8 }}>
              {statuses.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => changeStatus(invoice, s)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: invoice.status === s ? colors.primary : colors.borderDefault,
                    backgroundColor: invoice.status === s ? colors.primary + '10' : colors.backgroundSurface,
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors[statusColors[s] as keyof typeof colors] + '18',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons
                      name={invoice.status === s ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={colors[statusColors[s] as keyof typeof colors]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" color={invoice.status === s ? 'primary' : 'secondary'} style={{ fontWeight: invoice.status === s ? '700' as any : '400' as any }}>
                      {statusLabels[s]}
                    </AppText>
                    {s === 'paid' && invoice.status !== 'paid' ? (
                      <AppText variant="caption" color="muted">Se registra la fecha de hoy como fecha de pago.</AppText>
                    ) : null}
                  </View>
                  {invoice.status === s ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          );
        })() : null}
      </BottomSheet>

      <BottomSheet
        visible={!!historyInvoice}
        onClose={() => setHistoryInvoice(null)}
        title={historyInvoice ? `Historial - N° ${historyInvoice.invoiceNumber}` : 'Historial'}
      >
        {historyInvoice ? (
          historyLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <AppText variant="bodySmall" color="muted">Cargando historial...</AppText>
            </View>
          ) : historyEntries.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={32} color={colors.textMuted} />
              <AppText variant="bodySmall" color="muted">Sin movimientos registrados.</AppText>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {historyEntries.map((entry) => {
                const snapshotStatus = String(entry.snapshot?.status ?? '');
                const previousStatus = entry.previousSnapshot
                  ? String(entry.previousSnapshot.status ?? '')
                  : null;
                const statusChanged = previousStatus && previousStatus !== snapshotStatus;
                return (
                  <Card key={entry.id} style={{ padding: 14, gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: colors.info + '18',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons
                            name={
                              entry.action === 'created' ? 'add-circle-outline'
                              : entry.action === 'deleted' ? 'trash-outline'
                              : entry.action === 'imported' ? 'download-outline'
                              : 'create-outline'
                            }
                            size={15}
                            color={colors.info}
                          />
                        </View>
                        <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' as any }}>
                          {historyLabels[entry.action] ?? entry.action}
                        </AppText>
                      </View>
                      <AppText variant="caption" color="muted">
                        {new Date(entry.createdAt).toLocaleString('es-CL')}
                      </AppText>
                    </View>
                    {statusChanged && snapshotStatus ? (
                      <AppText variant="caption" color="success" style={{ fontWeight: '600' as any }}>
                        Estado: {statusLabels[previousStatus as InvoiceStatus] ?? previousStatus} → {statusLabels[snapshotStatus as InvoiceStatus] ?? snapshotStatus}
                      </AppText>
                    ) : null}
                    {entry.action === 'deleted' ? (
                      <AppText variant="caption" color="error">La factura fue eliminada.</AppText>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          )
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); resetForm(); }}
        title={editing ? 'Editar factura' : 'Nueva factura'}
        stickyFooter={
          <PrimaryButton
            label={editing ? 'Guardar cambios' : 'Crear factura'}
            icon="save-outline"
            onPress={submit}
          />
        }
      >
        <TextInput
          placeholder="Numero de factura"
          placeholderTextColor={colors.textMuted}
          style={inputStyle(colors)}
          value={formInvoiceNumber}
          onChangeText={setFormInvoiceNumber}
        />
        <TextInput
          placeholder="Fecha factura (YYYY-MM-DD)"
          placeholderTextColor={colors.textMuted}
          style={inputStyle(colors)}
          value={formInvoiceDate}
          onChangeText={setFormInvoiceDate}
        />
        <TextInput
          placeholder="Cliente"
          placeholderTextColor={colors.textMuted}
          style={inputStyle(colors)}
          value={formClientName}
          onChangeText={setFormClientName}
        />
        <TextInput
          placeholder="Monto neto"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          style={inputStyle(colors)}
          value={formNetAmount}
          onChangeText={setFormNetAmount}
        />
        <TextInput
          placeholder="Descripcion (opcional)"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={[inputStyle(colors), { minHeight: 80, textAlignVertical: 'top' as any }]}
          value={formDescription}
          onChangeText={setFormDescription}
        />

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => { setFormStatus('pending'); setFormPaymentDate(''); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: formStatus === 'pending' ? colors.warning : colors.borderDefault,
                backgroundColor: formStatus === 'pending' ? colors.warning + '18' : colors.backgroundSurface,
              }}
            >
              <Ionicons name="time-outline" size={18} color={formStatus === 'pending' ? colors.warning : colors.textMuted} />
              <AppText variant="bodySmall" color={formStatus === 'pending' ? 'warning' : 'muted'} style={{ fontWeight: '600' as any }}>Pendiente</AppText>
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => { setFormStatus('paid'); }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: formStatus === 'paid' ? colors.success : colors.borderDefault,
                backgroundColor: formStatus === 'paid' ? colors.success + '18' : colors.backgroundSurface,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={formStatus === 'paid' ? colors.success : colors.textMuted} />
              <AppText variant="bodySmall" color={formStatus === 'paid' ? 'success' : 'muted'} style={{ fontWeight: '600' as any }}>Pagada</AppText>
            </Pressable>
          </View>
        </View>

        {formStatus === 'paid' ? (
          <TextInput
            placeholder="Fecha de pago (YYYY-MM-DD)"
            placeholderTextColor={colors.textMuted}
            style={inputStyle(colors)}
            value={formPaymentDate}
            onChangeText={setFormPaymentDate}
          />
        ) : null}

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any, marginBottom: 12 }}>
            {error}
          </AppText>
        ) : null}

        <SecondaryButton label="Cancelar" onPress={() => { setShowForm(false); setEditing(null); resetForm(); }} />
      </BottomSheet>

      <BottomMenu />
    </>
  );
}

const styles = StyleSheet.create({
  invoiceIcon: {
    alignItems: 'center' as const,
    borderRadius: borderRadius.md,
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
    borderRadius: borderRadius.md,
  },
});

function inputStyle(colors: ReturnType<typeof useThemeColors>) {
  return {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  };
}
