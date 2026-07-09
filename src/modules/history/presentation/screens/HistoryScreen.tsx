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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortOption = 'newest' | 'name';

export function HistoryScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { catalogs, reload } = useCatalogs();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const sortedCatalogs = useMemo(() => {
    let result = [...catalogs];

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
  }, [catalogs, search, sortBy]);

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
    await useCases.deleteCatalog.execute(deleteId);
    setDeleteId(null);
    await reload();
  }

  const uniqueFormats = useMemo(
    () => [...new Set(catalogs.map((c) => c.format))],
    [catalogs],
  );

  return (
    <>
      <Screen>
        <Header
          eyebrow="Historial"
          title="Mis catálogos"
          subtitle={catalogs.length > 0 ? `${catalogs.length} PDF${catalogs.length !== 1 ? 's' : ''} generados` : 'Tus catálogos aparecerán aquí'}
        />

        {catalogs.length > 0 ? (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar catálogos..." />

            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
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

        {sortedCatalogs.length === 0 ? (
          <EmptyStateIllustrated
            icon="document-text-outline"
            title={catalogs.length === 0 ? 'Sin catálogos' : 'Sin resultados'}
            subtitle={
              catalogs.length === 0
                ? 'Genera tu primer catálogo PDF para verlo aquí.'
                : 'Ningún catálogo coincide con tu búsqueda.'
            }
            action={
              catalogs.length === 0 ? (
                <PrimaryButton
                  label="Crear catálogo"
                  icon="add-circle-outline"
                  onPress={() => navigate('CatalogBuilder')}
                />
              ) : undefined
            }
          />
        ) : (
          <Section title={`${sortedCatalogs.length} resultado${sortedCatalogs.length !== 1 ? 's' : ''}`}>
            {sortedCatalogs.map((catalog) => (
              <View key={catalog.id} style={{ marginBottom: 8 }}>
                <CatalogHistoryItem
                  name={catalog.name}
                  format={catalog.format}
                  date={formatDate(catalog.createdAt)}
                  productCount={catalog.productIds.length}
                  onShare={() => share(catalog.id)}
                  onDuplicate={() => duplicate(catalog.id)}
                  onDelete={() => confirmDelete(catalog.id)}
                />
              </View>
            ))}
          </Section>
        )}
      </Screen>

      <ConfirmDialog
        visible={deleteId !== null}
        title="Eliminar catálogo"
        message="Se eliminará del historial local. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={executeDelete}
        onCancel={() => setDeleteId(null)}
      />

      <FloatingActionButton
        icon="add"
        label="Catálogo"
        onPress={() => navigate('CatalogBuilder')}
        bottom={insets.bottom + 108}
      />

      <BottomMenu />
    </>
  );
}
