import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, TextInput, View, ScrollView, ActivityIndicator } from 'react-native';
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
  SearchBar,
  SecondaryButton,
  Section,
  ChoiceChip,
} from '../../../../shared/presentation/components/ui';
import { SupplierInputDto, supplierSchema } from '../../application/dtos/SupplierDtos';
import { Supplier } from '../../domain/entities/Supplier';
import { useSuppliers } from '../hooks/useSuppliers';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { borderRadius, spacing } from '../../../../shared/presentation/theme';

export function SuppliersScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { navigate } = useAppNavigation();
  const { suppliers, reload } = useSuppliers();
  const { products } = useProducts();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [generatingCatalog, setGeneratingCatalog] = useState(false);
  const [catalogUri, setCatalogUri] = useState<string | null>(null);

  const productCountBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    suppliers.forEach((s) => map.set(s.id, 0));
    products.forEach((p) => {
      if (p.supplierId) {
        map.set(p.supplierId, (map.get(p.supplierId) ?? 0) + 1);
      }
    });
    return map;
  }, [suppliers, products]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactName?.toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  async function submit() {
    if (!formName.trim() || formName.trim().length < 2) {
      setError('Nombre minimo de 2 caracteres');
      return;
    }

    const input: SupplierInputDto = {
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      contactName: formContactName.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    try {
      setError('');
      if (editing) {
        await useCases.updateSupplier.execute(editing.id, input);
      } else {
        await useCases.createSupplier.execute(input);
      }

      setEditing(null);
      setShowForm(false);
      resetForm();
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo guardar el proveedor.',
      );
    }
  }

  function resetForm() {
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormContactName('');
    setFormNotes('');
  }

  function startEdit(supplier: Supplier) {
    setSelectedSupplier(null);
    setEditing(supplier);
    setShowForm(true);
    setFormName(supplier.name);
    setFormPhone(supplier.phone ?? '');
    setFormEmail(supplier.email ?? '');
    setFormContactName(supplier.contactName ?? '');
    setFormNotes(supplier.notes ?? '');
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setShowForm(true);
  }

  async function remove(id: string) {
    const count = productCountBySupplier.get(id) ?? 0;
    Alert.alert(
      'Eliminar proveedor',
      count > 0
        ? `Hay ${count} producto${count !== 1 ? 's' : ''} asociado${count !== 1 ? 's' : ''}. Se desasociaran al eliminar.`
        : 'Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await useCases.deleteSupplier.execute(id);
            setSelectedSupplier((current) => (current?.id === id ? null : current));
            await reload();
          },
        },
      ],
    );
  }

  async function generateSupplierCatalog(supplier: Supplier) {
    const supplierProducts = products.filter((p) => p.supplierId === supplier.id);
    if (supplierProducts.length === 0) {
      Alert.alert('Sin productos', 'Este proveedor no tiene productos asociados.');
      return;
    }
    try {
      setGeneratingCatalog(true);
      setCatalogUri(null);
      const familyIds = [...new Set(supplierProducts.map((p) => p.familyId))];
      const catalog = await useCases.generateCatalogPdf.execute({
        name: `Catálogo - ${supplier.name}`,
        familyIds,
        format: 'simple-list',
        purpose: 'catalog',
        productIds: supplierProducts.map((p) => p.id),
      });
      setCatalogUri(catalog.pdfUri);
      await useCases.shareCatalogPdf.shareFile(catalog.pdfUri, `Catálogo - ${supplier.name}`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo generar el catálogo');
    } finally {
      setGeneratingCatalog(false);
    }
  }

  const supplierColors = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F59E0B',
  ];

  return (
    <>
      <Screen>
        <Header
          eyebrow="Proveedores"
          title="Gestion de proveedores"
          subtitle={
            suppliers.length > 0
              ? `${suppliers.length} proveedor${suppliers.length !== 1 ? 'es' : ''} registrado${suppliers.length !== 1 ? 's' : ''}`
              : 'Registra tus proveedores para organizar sus productos'
          }
          action={
            <Pressable onPress={() => navigate('Cart')} style={{ padding: 8 }}>
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
            </Pressable>
          }
        />

        {suppliers.length > 0 ? (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar proveedor..." />
          </>
        ) : null}

        {error ? (
          <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any }}>
            {error}
          </AppText>
        ) : null}

        {suppliers.length === 0 ? (
          <EmptyStateIllustrated
            icon="people-outline"
            title="Sin proveedores"
            subtitle="Registra tu primer proveedor para asociar productos a sus catalogos."
            action={
              <PrimaryButton
                label="Crear proveedor"
                icon="add-circle-outline"
                onPress={openCreate}
              />
            }
          />
        ) : filteredSuppliers.length === 0 ? (
          <EmptyStateIllustrated
            icon="search-outline"
            title="Sin resultados"
            subtitle="Ningun proveedor coincide con tu busqueda."
          />
        ) : (
          <Section
            title={`${filteredSuppliers.length} resultado${filteredSuppliers.length !== 1 ? 's' : ''}`}
            action={
              <Pressable onPress={openCreate}>
                <AppText variant="labelLarge" color="accent">+ Nuevo</AppText>
              </Pressable>
            }
          >
            {filteredSuppliers.map((supplier, index) => {
              const productCount = productCountBySupplier.get(supplier.id) ?? 0;
              const color = supplierColors[index % supplierColors.length];

              return (
                <Card key={supplier.id} style={{ marginBottom: 8 }}>
                  <Pressable onPress={() => setSelectedSupplier(supplier)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: borderRadius.medium,
                          backgroundColor: color + '18',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="business-outline" size={20} color={color} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText variant="bodyMedium" color="primary" numberOfLines={1} style={{ fontWeight: '600' as any }}>
                          {supplier.name}
                        </AppText>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                          <AppText variant="caption" color="muted">
                            {productCount} producto{productCount !== 1 ? 's' : ''}
                          </AppText>
                          {supplier.contactName ? (
                            <>
                              <AppText variant="caption" color="disabled">·</AppText>
                              <AppText variant="caption" color="muted">{supplier.contactName}</AppText>
                            </>
                          ) : null}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                </Card>
              );
            })}
          </Section>
        )}
      </Screen>

      <BottomSheet
        visible={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        title="Detalle del proveedor"
        stickyFooter={
          selectedSupplier ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  label="Editar"
                  icon="create-outline"
                  onPress={() => startEdit(selectedSupplier)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Ver productos"
                  icon="cube-outline"
                  onPress={() => {
                    setSelectedSupplier(null);
                    navigate('Products');
                  }}
                />
              </View>
            </View>
          ) : undefined
        }
      >
        {selectedSupplier ? (
          <View style={{ gap: 12 }}>
            <Card style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <AppText variant="bodySmall" color="muted">Nombre</AppText>
                <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right', fontWeight: '600' as any }}>
                  {selectedSupplier.name}
                </AppText>
              </View>
              {selectedSupplier.contactName ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Contacto</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {selectedSupplier.contactName}
                  </AppText>
                </View>
              ) : null}
              {selectedSupplier.phone ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Telefono</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {selectedSupplier.phone}
                  </AppText>
                </View>
              ) : null}
              {selectedSupplier.email ? (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="bodySmall" color="muted">Email</AppText>
                  <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right' }}>
                    {selectedSupplier.email}
                  </AppText>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <AppText variant="bodySmall" color="muted">Productos</AppText>
                <AppText variant="bodySmall" color="primary" style={{ flex: 1, textAlign: 'right', fontWeight: '600' as any }}>
                  {productCountBySupplier.get(selectedSupplier.id) ?? 0}
                </AppText>
              </View>
            </Card>
            {selectedSupplier.notes ? (
              <AppText variant="caption" color="muted">Notas: {selectedSupplier.notes}</AppText>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => { startEdit(selectedSupplier); }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.primarySoft,
                }}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <AppText variant="bodySmall" color="accent" style={{ fontWeight: '600' as any }}>Editar</AppText>
              </Pressable>
              <Pressable
                onPress={() => { remove(selectedSupplier.id); }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: colors.errorLight,
                }}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' as any }}>Eliminar</AppText>
              </Pressable>
            </View>
            <Pressable
              onPress={() => generateSupplierCatalog(selectedSupplier)}
              disabled={generatingCatalog}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.primarySoft,
                opacity: generatingCatalog ? 0.6 : 1,
              }}
            >
              {generatingCatalog ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              )}
              <AppText variant="bodySmall" color="accent" style={{ fontWeight: '600' as any }}>
                {generatingCatalog ? 'Generando...' : 'Generar catálogo del proveedor'}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                setSelectedSupplier(null);
                navigate('PurchaseCart', { supplierName: selectedSupplier.name });
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: colors.success + '18',
              }}
            >
              <Ionicons name="cart-outline" size={18} color={colors.success} />
              <AppText variant="bodySmall" color="success" style={{ fontWeight: '600' as any }}>
                Ir a compra
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </BottomSheet>

      <BottomSheet
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); resetForm(); }}
        title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
        stickyFooter={
          <PrimaryButton
            label={editing ? 'Guardar cambios' : 'Crear proveedor'}
            icon="save-outline"
            onPress={submit}
          />
        }
      >
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
            marginBottom: 12,
          }}
          value={formName}
          onChangeText={setFormName}
        />
        <TextInput
          placeholder="Nombre de contacto (opcional)"
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
          value={formContactName}
          onChangeText={setFormContactName}
        />
        <TextInput
          placeholder="Telefono (opcional)"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
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
          value={formPhone}
          onChangeText={setFormPhone}
        />
        <TextInput
          placeholder="Email (opcional)"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
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
          value={formEmail}
          onChangeText={setFormEmail}
        />
        <TextInput
          placeholder="Notas (opcional)"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
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
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          value={formNotes}
          onChangeText={setFormNotes}
        />
        <SecondaryButton label="Cancelar" onPress={() => { setShowForm(false); setEditing(null); resetForm(); }} />
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
