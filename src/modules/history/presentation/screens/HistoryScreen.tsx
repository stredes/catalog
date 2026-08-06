import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  CatalogHistoryItem,
  ConfirmDialog,
  EmptyStateIllustrated,
  FloatingActionButton,
  Header,
  PrimaryButton,
  Screen,
  SearchBar,
  Section,
  ChoiceChip,
} from '../../../../shared/presentation/components/ui';
import { formatDate } from '../../../../shared/utils/dates';
import { useCatalogs } from '../../../catalogs/presentation/hooks/useCatalogs';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CatalogPurpose } from '../../../catalogs/domain/entities/Catalog';
import { usePurchaseDocuments } from '../../../purchase-documents/presentation/hooks/usePurchaseDocuments';
import { PurchaseDocumentType } from '../../../purchase-documents/domain/entities/PurchaseDocument';
import { formatMoney } from '../../../../shared/utils/money';

type SortOption = 'newest' | 'name';
type PurposeFilter = 'all' | CatalogPurpose | PurchaseDocumentType;

export function HistoryScreen() {
  const colors = useThemeColors();
  const { useCases, repositories } = useDependencies();
  const { navigate } = useAppNavigation();
  const { catalogs, reload } = useCatalogs();
  const { documents, reload: reloadPurchaseDocuments } = usePurchaseDocuments();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sortedCatalogs = useMemo(() => {
    let result = [...catalogs];

    if (purposeFilter === 'quotation' || purposeFilter === 'purchase-order') return [];
    if (purposeFilter !== 'all') {
      result = result.filter((c) => c.purpose === purposeFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [catalogs, search, sortBy, purposeFilter]);

  const sortedPurchaseDocuments = useMemo(() => {
    let result = [...documents];
    if (purposeFilter === 'catalog' || purposeFilter === 'purchase-detail') return [];
    if (purposeFilter !== 'all') result = result.filter((document) => document.type === purposeFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((document) =>
        document.supplierName.toLowerCase().includes(q) || String(document.documentNumber).includes(q),
      );
    }
    if (sortBy === 'name') result.sort((a, b) => a.supplierName.localeCompare(b.supplierName));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [documents, purposeFilter, search, sortBy]);

  const totalDocumentCount = catalogs.length + documents.length;
  const resultCount = sortedCatalogs.length + sortedPurchaseDocuments.length;

  async function share(id: string) {
    const catalog = catalogs.find((item) => item.id === id);
    if (!catalog) return;
    try {
      setError('');
      await useCases.shareCatalogPdf.execute(catalog);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo abrir el catálogo.',
      );
    }
  }

  async function sharePurchaseDocument(id: string) {
    const document = documents.find((item) => item.id === id);
    if (!document?.pdfUri) return;
    try {
      setError('');
      const title = document.type === 'quotation' ? 'Cotización' : 'Orden de compra';
      await useCases.shareCatalogPdf.shareFile(document.pdfUri, `${title} N° ${String(document.documentNumber).padStart(4, '0')}`);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'No se pudo compartir el documento.');
    }
  }

  async function duplicate(id: string) {
    try {
      setError('');
      await useCases.duplicateCatalog.execute(id);
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo duplicar el catálogo.',
      );
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  async function executeDelete() {
    if (!deleteId) return;
    if (documents.some((document) => document.id === deleteId)) {
      await repositories.purchaseDocuments.delete(deleteId);
      await reloadPurchaseDocuments();
    } else {
      await useCases.deleteCatalog.execute(deleteId);
      await reload();
    }
    setDeleteId(null);
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Historial"
          title="Mis documentos"
          subtitle={totalDocumentCount > 0 ? `${totalDocumentCount} documento${totalDocumentCount !== 1 ? 's' : ''} generado${totalDocumentCount !== 1 ? 's' : ''}` : 'Tus documentos aparecerán aquí'}
        />

        {totalDocumentCount > 0 ? (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar catálogos..." />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              <ChoiceChip
                label="Todos"
                selected={purposeFilter === 'all'}
                onPress={() => setPurposeFilter('all')}
              />
              <ChoiceChip
                label="Catálogos"
                selected={purposeFilter === 'catalog'}
                onPress={() => setPurposeFilter('catalog')}
              />
              <ChoiceChip
                label="Detalles de compra"
                selected={purposeFilter === 'purchase-detail'}
                onPress={() => setPurposeFilter('purchase-detail')}
              />
              <ChoiceChip
                label="Cotizaciones proveedor"
                selected={purposeFilter === 'quotation'}
                onPress={() => setPurposeFilter('quotation')}
              />
              <ChoiceChip
                label="Órdenes de compra"
                selected={purposeFilter === 'purchase-order'}
                onPress={() => setPurposeFilter('purchase-order')}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
              <ChoiceChip
                label="Más recientes"
                selected={sortBy === 'newest'}
                onPress={() => setSortBy('newest')}
                color={colors.textSecondary}
              />
              <ChoiceChip
                label="Nombre"
                selected={sortBy === 'name'}
                onPress={() => setSortBy('name')}
                color={colors.textSecondary}
              />
            </View>
          </>
        ) : null}

        {error ? <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' } as any}>{error}</AppText> : null}

        {resultCount === 0 ? (
          <EmptyStateIllustrated
            icon="document-text-outline"
            title={totalDocumentCount === 0 ? 'Sin documentos' : 'Sin resultados'}
            subtitle={
              totalDocumentCount === 0
                ? 'Genera tu primer documento para verlo aquí.'
                : 'Ningún documento coincide con tu búsqueda.'
            }
            action={
              totalDocumentCount === 0 ? (
                <PrimaryButton
                  label="Crear documento"
                  icon="add-circle-outline"
                  onPress={() => navigate('CatalogBuilder')}
                />
              ) : undefined
            }
          />
        ) : (
          <Section title={`${resultCount} resultado${resultCount !== 1 ? 's' : ''}`}>
            {sortedCatalogs.map((catalog) => (
              <View key={catalog.id}>
                <CatalogHistoryItem
                  name={catalog.name}
                  format={catalog.format}
                  purpose={catalog.purpose}
                  date={formatDate(catalog.createdAt)}
                  productCount={catalog.productIds.length}
                  onShare={() => share(catalog.id)}
                  onDuplicate={() => duplicate(catalog.id)}
                  onDelete={() => confirmDelete(catalog.id)}
                />
              </View>
            ))}
            {sortedPurchaseDocuments.map((document) => (
              <View key={document.id} style={{ marginBottom: 8 }}>
                <CatalogHistoryItem
                  name={`N° ${String(document.documentNumber).padStart(4, '0')} - ${document.supplierName}`}
                  format={formatMoney(document.total)}
                  purpose={document.type}
                  date={formatDate(document.createdAt)}
                  productCount={document.items.length}
                  onShare={() => sharePurchaseDocument(document.id)}
                  onDelete={() => confirmDelete(document.id)}
                />
              </View>
            ))}
          </Section>
        )}
      </Screen>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar documento"
        message="Se eliminará del historial local. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

      <FloatingActionButton
        icon="add"
        label="Nuevo"
        onPress={() => navigate('CatalogBuilder')}
        bottom={insets.bottom + 108}
      />

      <BottomMenu />
    </>
  );
}
