import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../hooks/use-profile';
import {
  AppInput,
  AppButton,
  PhotoPicker,
  LoadingOverlay,
  ErrorBanner,
} from '../../../../shared/presentation/components';
import { colors, spacing, typography, shadows } from '../../../../shared/presentation/theme';

export function ProfileScreen() {
  const { profile, loading, error, saveProfile, deleteProfile } = useProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [rut, setRut] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(profile?.name ?? '');
    setEmail(profile?.email ?? '');
    setPhone(profile?.phone ?? '');
    setCompany(profile?.company ?? '');
    setAddress(profile?.address ?? '');
    setRut(profile?.rut ?? '');
    setPhotoUri(profile?.photoUri ?? null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !company.trim() || !address.trim() || !rut.trim()) return;
    setSaving(true);
    await saveProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), company: company.trim(), address: address.trim(), rut: rut.trim(), photoUri });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar perfil',
      '¿Estás seguro de eliminar tu perfil? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile();
            setEditing(false);
          },
        },
      ],
    );
  };

  const canSave = name.trim() && email.trim() && phone.trim() && company.trim() && address.trim() && rut.trim();

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingOverlay visible />
      </View>
    );
  }

  if (!profile && !editing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Completá tus datos para personalizar tu experiencia.</Text>
        <ErrorBanner message={error} />
        <View style={styles.card}>
          <AppInput label="Nombre" placeholder="Tu nombre" value={name} onChangeText={setName} />
          <AppInput label="Email" placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <AppInput label="Teléfono" placeholder="+56 9 1234 5678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <AppInput label="Empresa" placeholder="Nombre de tu empresa" value={company} onChangeText={setCompany} />
          <AppInput label="Dirección" placeholder="Dirección comercial" value={address} onChangeText={setAddress} />
          <AppInput label="RUT" placeholder="12.345.678-9" value={rut} onChangeText={setRut} />
          <PhotoPicker label="Foto de perfil" value={photoUri} onChange={setPhotoUri} />
          <AppButton title={saving ? 'Guardando...' : 'Crear perfil'} onPress={handleSave} disabled={!canSave || saving} loading={saving} />
        </View>
      </View>
    );
  }

  if (editing) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Editar perfil</Text>
        <ErrorBanner message={error} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <AppInput label="Nombre" placeholder="Tu nombre" value={name} onChangeText={setName} />
            <AppInput label="Email" placeholder="correo@ejemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <AppInput label="Teléfono" placeholder="+56 9 1234 5678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <AppInput label="Empresa" placeholder="Nombre de tu empresa" value={company} onChangeText={setCompany} />
            <AppInput label="Dirección" placeholder="Dirección comercial" value={address} onChangeText={setAddress} />
            <AppInput label="RUT" placeholder="12.345.678-9" value={rut} onChangeText={setRut} />
            <PhotoPicker label="Foto de perfil" value={photoUri} onChange={setPhotoUri} />
            <View style={styles.editActions}>
              <AppButton title="Cancelar" variant="outline" onPress={handleCancel} style={{ flex: 1 }} />
              <AppButton title={saving ? 'Guardando...' : 'Guardar'} onPress={handleSave} disabled={!canSave || saving} loading={saving} style={{ flex: 1 }} />
            </View>
            <View style={styles.deleteSection}>
              <AppButton title="Eliminar perfil" variant="danger" onPress={handleDelete} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <ErrorBanner message={error} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {profile!.photoUri && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile!.name.charAt(0).toUpperCase()}</Text>
              </View>
            </View>
          )}

          <ProfileField label="Nombre" value={profile!.name} />
          <ProfileField label="Email" value={profile!.email} />
          <ProfileField label="Teléfono" value={profile!.phone} />
          <ProfileField label="Empresa" value={profile!.company} />
          <ProfileField label="Dirección" value={profile!.address} />
          <ProfileField label="RUT" value={profile!.rut} />

          <View style={styles.editActions}>
            <AppButton title="Editar perfil" onPress={startEdit} style={{ flex: 1 }} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl, lineHeight: 21 },
  scroll: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.xl,
    ...shadows.sm,
  },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.white },
  field: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 16, color: colors.textPrimary },
  editActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  deleteSection: { marginTop: spacing.xxl, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.xl },
});
