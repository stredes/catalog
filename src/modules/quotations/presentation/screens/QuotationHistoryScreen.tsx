import { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
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
import { borderRadius, spacing } from '../../../../shared/presentation/theme';
import { formatMoney } from '../../../../shared/utils/money';
import { formatDate } from '../../../../shared/utils/dates';
import { useQuotations } from '../hooks/useQuotations';
import { Quotation, QuotationStatus } from '../../domain/entities/Quotation';

type SortOption = 'newest' | 'name';
type StatusFilter = 'all' | QuotationStatus;

const statusColors: Record<QuotationStatus, string> = {
  pending: 'info',
  accepted: 'success',
  paid: 'accent',
  rejected: 'error',
  deleted: 'muted',
} as const;

const statusLabels: Record<QuotationStatus, string> = {
  pending: 'EN ESPERA',
  accepted: 'ACEPTADA',
  paid: 'PAGADA',
  rejected: 'RECHAZADA',
  deleted: 'ELIMINADA',
};

export function QuotationHistoryScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { quotations, loading, reload } = useQuotations();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  const sortedQuotations = useMemo(() => {
    let result = [...quotations];

    if (statusFilter !== 'all') {
      result = result.filter((q) => q.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (qt) =>
          qt.clientName.toLowerCase().includes(q) ||
          String(qt.quotationNumber).includes(q) ||
          qt.items.some((i) => i.description.toLowerCase().includes(q)),
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
  }, [quotations, search, sortBy, statusFilter]);

  const pendingCount = useMemo(() => quotations.filter((q) => q.status === 'pending').length, [quotations]);
  const acceptedCount = useMemo(() => quotations.filter((q) => q.status === 'accepted').length, [quotations]);

  async function shareQuotation(quotation: Quotation) {
    try {
      setError('');
      const profile = await useCases.getProfile.execute();
      const uri = await useCases.generateQuotationPdf.execute(quotation, profile);
      await useCases.shareCatalogPdf.shareFile(uri, `Cotizacion - ${quotation.clientName}`);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo compartir la cotizacion.',
      );
    }
  }

  async function changeStatus(quotation: Quotation, newStatus: QuotationStatus) {
    try {
      setError('');
      await useCases.updateQuotation.execute({ ...quotation, status: newStatus });
      setStatusMenuId(null);
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo cambiar el estado.',
      );
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  async function executeDelete() {
    if (!deleteId) return;
    try {
      await useCases.deleteQuotation.execute(deleteId);
      setDeleteId(null);
      await reload();
    } catch (currentError) {
      setDeleteId(null);
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo eliminar la cotizacion.',
      );
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Cotizaciones"
          title="Historial de cotizaciones"
          subtitle={
            quotations.length > 0
              ? `${quotations.length} cotizacion${quotations.length !== 1 ? 'es' : ''}`
              : 'Tus cotizaciones apareceran aqui'
          }
          action={
            <Pressable onPress={() => navigate('QuotationBuilder')} style={{ padding: 8 }}>
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            </Pressable>
          }
        />

        {quotations.length > 0 ? (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente o servicio..." />

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
              <ChoiceChip
                label={`Todos (${quotations.length})`}
                selected={statusFilter === 'all'}
                onPress={() => setStatusFilter('all')}
                color={colors.textSecondary}
              />
              <ChoiceChip
                label={`En espera (${pendingCount})`}
                selected={statusFilter === 'pending'}
                onPress={() => setStatusFilter('pending')}
                color={colors.info}
              />
              <ChoiceChip
                label={`Aceptadas (${acceptedCount})`}
                selected={statusFilter === 'accepted'}
                onPress={() => setStatusFilter('accepted')}
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

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any }}>
            {error}
          </AppText>
        ) : null}

        {loading ? (
          <Card>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <AppText variant="bodySmall" color="muted">Cargando cotizaciones...</AppText>
            </View>
          </Card>
        ) : quotations.length === 0 ? (
          <EmptyStateIllustrated
            icon="document-text-outline"
            title="Sin cotizaciones"
            subtitle="Crea tu primera cotizacion desde el formulario de cotizaciones."
            action={
              <PrimaryButton
                label="Crear cotizacion"
                icon="add-circle-outline"
                onPress={() => navigate('QuotationBuilder')}
              />
            }
          />
        ) : sortedQuotations.length === 0 ? (
          <EmptyStateIllustrated
            icon="document-text-outline"
            title="Sin resultados"
            subtitle="Ninguna cotizacion coincide con tu busqueda."
          />
        ) : (
          <Section title={`${sortedQuotations.length} resultado${sortedQuotations.length !== 1 ? 's' : ''}`}>
            {sortedQuotations.map((quotation) => {
              const isExpanded = expandedId === quotation.id;
              const sc = statusColors[quotation.status] ?? 'info';
              const sl = statusLabels[quotation.status] ?? 'BORRADOR';

              return (
                <Card key={quotation.id} style={{ marginBottom: 8 }}>
                  <Pressable onPress={() => toggleExpand(quotation.id)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={[
                          styles.orderIcon,
                          { backgroundColor: colors[sc as keyof typeof colors] + '18' },
                        ]}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={18}
                          color={colors[sc as keyof typeof colors]}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' as any }}>
                            N° {String(quotation.quotationNumber).padStart(4, '0')} - {quotation.clientName}
                          </AppText>
                          <View style={{
                            backgroundColor: colors[sc as keyof typeof colors] + '18',
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                          }}>
                            <AppText variant="caption" color={sc as any} style={{ fontWeight: '700' as any, fontSize: 10 }}>
                              {sl}
                            </AppText>
                          </View>
                        </View>
                        <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>
                          {formatDate(quotation.createdAt)} · {quotation.items.length} servicio{quotation.items.length !== 1 ? 's' : ''}
                        </AppText>
                      </View>
                      <View style={{ flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any, minWidth: 80, textAlign: 'right' as any }}>
                          {formatMoney(quotation.total)}
                        </AppText>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                      </View>
                    </View>
                  </Pressable>

                  {isExpanded ? (
                    <View style={styles.expandedContent}>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      {quotation.items.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <AppText variant="bodySmall" color="primary" numberOfLines={1}>{item.description}</AppText>
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
                      <View style={styles.itemRow}>
                        <AppText variant="bodySmall" color="muted">Precio Neto</AppText>
                        <AppText variant="bodySmall" color="primary">{formatMoney(quotation.subtotal)}</AppText>
                      </View>
                      <View style={styles.itemRow}>
                        <AppText variant="bodySmall" color="muted">IVA ({quotation.ivaRate}%)</AppText>
                        <AppText variant="bodySmall" color="primary">{formatMoney(quotation.ivaAmount)}</AppText>
                      </View>
                      <View style={styles.totalRow}>
                        <AppText variant="bodySmall" color="muted">Total</AppText>
                        <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '700' as any }}>
                          {formatMoney(quotation.total)}
                        </AppText>
                      </View>
                      {quotation.notes ? (
                        <AppText variant="caption" color="muted" style={{ marginTop: 6 }}>Notas: {quotation.notes}</AppText>
                      ) : null}
                      {quotation.validUntil ? (
                        <AppText variant="caption" color="muted" style={{ marginTop: 2 }}>Vigente hasta: {new Date(quotation.validUntil).toLocaleDateString('es-CL')}</AppText>
                      ) : null}
                      <View style={styles.actionRow}>
                        <Pressable
                          onPress={() => setStatusMenuId(statusMenuId === quotation.id ? null : quotation.id)}
                          style={[styles.actionButton, { backgroundColor: colors[sc as keyof typeof colors] + '18' }]}
                        >
                          <Ionicons name="swap-horizontal-outline" size={16} color={colors[sc as keyof typeof colors]} />
                          <AppText variant="caption" color={sc as any}>Estado</AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => shareQuotation(quotation)}
                          style={[styles.actionButton, { backgroundColor: colors.primarySoft }]}
                        >
                          <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                          <AppText variant="caption" color="accent">Compartir</AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(quotation.id)}
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
        title="Eliminar cotizacion"
        message="Se eliminara del historial. Esta accion no se puede deshacer."
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
          const quotation = quotations.find((q) => q.id === statusMenuId);
          if (!quotation) return null;
          const statuses: QuotationStatus[] = ['pending', 'accepted', 'paid', 'rejected', 'deleted'];
          return (
            <View style={{ gap: 8 }}>
              {statuses.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => changeStatus(quotation, s)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: quotation.status === s ? colors.primary : colors.borderDefault,
                    backgroundColor: quotation.status === s ? colors.primary + '10' : colors.backgroundSurface,
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
                      name={quotation.status === s ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={colors[statusColors[s] as keyof typeof colors]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" color={quotation.status === s ? 'primary' : 'secondary'} style={{ fontWeight: quotation.status === s ? '700' as any : '400' as any }}>
                      {statusLabels[s]}
                    </AppText>
                  </View>
                  {quotation.status === s ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
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
});
