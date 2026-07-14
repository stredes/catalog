import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState as useStateReact } from 'react';
import { useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyStateIllustrated,
  Header,
  Input,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Section,
  CatalogHistoryItem,
  BottomSheet,
} from '../../../../shared/presentation/components/ui';
import { formatDate } from '../../../../shared/utils/dates';
import { useCatalogs } from '../../../catalogs/presentation/hooks/useCatalogs';
import { useFamilies } from '../../../families/presentation/hooks/useFamilies';
import { useProducts } from '../../../products/presentation/hooks/useProducts';
import { ProfileInputDto, profileSchema, CHILEAN_BANKS, BANK_ACCOUNT_TYPES } from '../../application/dtos/ProfileDtos';
import { useProfile } from '../hooks/useProfile';
import { useTheme, useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { User } from '../../../auth/domain/AuthPort';

const USER_KEY = 'catalog_clean_user';

export function ProfileScreen() {
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const { navigate } = useAppNavigation();
  const { useCases, services } = useDependencies();
  const { catalogs, reload } = useCatalogs();
  const { families } = useFamilies();
  const { products } = useProducts();
  const { profile, reload: reloadProfile } = useProfile();
  const [logoUri, setLogoUri] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showAccountTypePicker, setShowAccountTypePicker] = useState(false);

  useEffect(() => {
    services.preferences.getString(USER_KEY).then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const form = useForm<ProfileInputDto>({
    defaultValues: {
      businessName: '',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      website: '',
      logoUri: undefined,
      bankName: '',
      bankAccountType: '',
      bankAccountNumber: '',
    },
    resolver: zodResolver(profileSchema) as Resolver<ProfileInputDto>,
  });

  useEffect(() => {
    if (!profile) return;
    setLogoUri(profile.logoUri);
    form.reset({
      businessName: profile.businessName,
      ownerName: profile.ownerName ?? '',
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      address: profile.address ?? '',
      website: profile.website ?? '',
      logoUri: profile.logoUri,
      bankName: profile.bankName ?? '',
      bankAccountType: profile.bankAccountType ?? '',
      bankAccountNumber: profile.bankAccountNumber ?? '',
    });
  }, [form, profile]);

  async function saveProfile(input: ProfileInputDto) {
    try {
      setError('');
      await useCases.saveProfile.execute({ ...input, logoUri });
      await reloadProfile();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo guardar el perfil.',
      );
    }
  }

  async function pickLogo() {
    try {
      setError('');
      const uri = await useCases.pickProfileLogo.execute();
      setLogoUri(uri);
      form.setValue('logoUri', uri);
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo seleccionar el logo.',
      );
    }
  }

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

  async function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await services.auth.logout();
            navigate('Login');
          },
        },
      ],
    );
  }

  const stats = useMemo(() => [
    { label: 'Productos', value: String(products.length), icon: 'cube-outline' },
    { label: 'Familias', value: String(families.length), icon: 'folder-outline' },
    { label: 'Catálogos', value: String(catalogs.length), icon: 'document-text-outline' },
  ], [products, families, catalogs]);

  return (
    <>
      <Screen>
        <Header
          eyebrow="Perfil"
          title="Mi negocio"
          subtitle="Configura los datos que aparecerán en tus catálogos PDF."
        />

        {user && (
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primaryLight,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="person-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>
                  {user.name}
                </AppText>
                <AppText variant="bodySmall" color="secondary">{user.email}</AppText>
              </View>
            </View>
          </Card>
        )}

        <Card>
          <CardHeader title="Información del negocio" />
          <Input
            label="Nombre del negocio"
            placeholder="Ej: Mi Tienda"
            value={form.watch('businessName')}
            onChangeText={(t) => form.setValue('businessName', t)}
            error={form.formState.errors.businessName?.message}
          />
          <Input
            label="Nombre del responsable"
            placeholder="Tu nombre"
            value={form.watch('ownerName') ?? ''}
            onChangeText={(t) => form.setValue('ownerName', t)}
          />
        </Card>

        <Card>
          <CardHeader title="Contacto" />
          <Input
            label="Teléfono"
            placeholder="+56 9 XXXX XXXX"
            value={form.watch('phone') ?? ''}
            onChangeText={(t) => form.setValue('phone', t)}
          />
          <Input
            label="Correo electrónico"
            placeholder="correo@ejemplo.cl"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.watch('email') ?? ''}
            onChangeText={(t) => form.setValue('email', t)}
            error={form.formState.errors.email?.message}
          />
          <Input
            label="Dirección"
            placeholder="Dirección del negocio"
            value={form.watch('address') ?? ''}
            onChangeText={(t) => form.setValue('address', t)}
          />
          <Input
            label="Sitio web / Redes sociales"
            placeholder="ejemplo.cl o @instagram"
            autoCapitalize="none"
            value={form.watch('website') ?? ''}
            onChangeText={(t) => form.setValue('website', t)}
          />
        </Card>

        <Card>
          <CardHeader title="Logo" />
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: colors.borderDefault, marginBottom: 12 }}
              resizeMode="cover"
            />
          ) : null}
          <SecondaryButton
            label={logoUri ? 'Cambiar logo' : 'Seleccionar logo'}
            icon="image-outline"
            onPress={pickLogo}
          />
        </Card>

        <Card>
          <CardHeader title="Datos bancarios" subtitle="Información para transferencias y pagos" />
          <Pressable
            onPress={() => setShowBankPicker(true)}
            style={{
              backgroundColor: colors.backgroundSurface,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 12,
            }}
          >
            <AppText variant="labelMedium" color="muted" style={{ marginBottom: 4 }}>Banco</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="bodyMedium" color={form.watch('bankName') ? 'primary' : 'muted'}>
                {form.watch('bankName') || 'Seleccionar banco'}
              </AppText>
              <Ionicons name="chevron-down-outline" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setShowAccountTypePicker(true)}
            style={{
              backgroundColor: colors.backgroundSurface,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.borderDefault,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 12,
            }}
          >
            <AppText variant="labelMedium" color="muted" style={{ marginBottom: 4 }}>Tipo de cuenta</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText variant="bodyMedium" color={form.watch('bankAccountType') ? 'primary' : 'muted'}>
                {form.watch('bankAccountType') || 'Seleccionar tipo'}
              </AppText>
              <Ionicons name="chevron-down-outline" size={18} color={colors.textMuted} />
            </View>
          </Pressable>

          <Input
            label="Número de cuenta"
            placeholder="1234567890"
            keyboardType="numeric"
            value={form.watch('bankAccountNumber') ?? ''}
            onChangeText={(t) => form.setValue('bankAccountNumber', t)}
          />
        </Card>

        <Card>
          <CardHeader title="Apariencia" />
          <Pressable
            onPress={toggleTheme}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={22} color={colors.textPrimary} />
              <View>
                <AppText variant="bodyMedium" color="primary" style={{ fontWeight: '600' } as any}>Modo oscuro</AppText>
                <AppText variant="bodySmall" color="secondary">{isDark ? 'Activado' : 'Desactivado'}</AppText>
              </View>
            </View>
            <View style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDark ? colors.primary : colors.textDisabled,
              padding: 3,
              justifyContent: 'center',
            }}>
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.textInverse,
                alignSelf: isDark ? 'flex-end' : 'flex-start',
              }} />
            </View>
          </Pressable>
        </Card>

        <PrimaryButton label="Guardar perfil" icon="save-outline" onPress={form.handleSubmit(saveProfile)} />

        {error ? <AppText variant="bodySmall" color="error" style={{ marginTop: 8, fontWeight: '600' } as any}>{error}</AppText> : null}

        <Card>
          <CardHeader title="Resumen local" />
          <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'space-around' }}>
            {stats.map((s) => (
              <View key={s.label} style={{ alignItems: 'center' }}>
                <Ionicons name={s.icon as any} size={24} color={colors.primary} />
                <AppText variant="metric" color="primary" style={{ marginTop: 4 }}>{s.value}</AppText>
                <AppText variant="caption" color="secondary">{s.label}</AppText>
              </View>
            ))}
          </View>
        </Card>

        <Section title="Historial de catálogos">
          {catalogs.length === 0 ? (
            <EmptyStateIllustrated
              icon="document-text-outline"
              title="Sin catálogos"
              subtitle="Los catálogos que generes aparecerán aquí."
            />
          ) : (
            catalogs.map((catalog) => (
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
            ))
          )}
        </Section>

        <SecondaryButton
          label="Cerrar sesión"
          icon="log-out-outline"
          onPress={handleLogout}
        />
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

      <BottomSheet
        visible={showBankPicker}
        onClose={() => setShowBankPicker(false)}
        title="Seleccionar banco"
      >
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {CHILEAN_BANKS.map((bank) => (
            <Pressable
              key={bank}
              onPress={() => {
                form.setValue('bankName', bank);
                setShowBankPicker(false);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderDefault,
              }}
            >
              <AppText variant="bodyMedium" color={form.watch('bankName') === bank ? 'accent' : 'primary'}>
                {bank}
              </AppText>
              {form.watch('bankName') === bank && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={showAccountTypePicker}
        onClose={() => setShowAccountTypePicker(false)}
        title="Tipo de cuenta"
      >
        {BANK_ACCOUNT_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => {
              form.setValue('bankAccountType', type);
              setShowAccountTypePicker(false);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderDefault,
            }}
          >
            <AppText variant="bodyMedium" color={form.watch('bankAccountType') === type ? 'accent' : 'primary'}>
              {type}
            </AppText>
            {form.watch('bankAccountType') === type && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </Pressable>
        ))}
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
