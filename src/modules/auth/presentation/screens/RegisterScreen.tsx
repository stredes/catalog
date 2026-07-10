import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { AppText, PrimaryButton, SecondaryButton } from '../../../../shared/presentation/components/ui';

export function RegisterScreen() {
  const { navigate } = useAppNavigation();
  const { services } = useDependencies();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await services.auth.register(email.trim(), password, name.trim());
      navigate('Onboarding');
    } catch (e: any) {
      setError(e.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundPrimary,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 32,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <Ionicons name="person-add-outline" size={48} color={colors.primary} />
          </View>
          <AppText
            variant="headingLarge"
            color="primary"
            style={{ textAlign: 'center', marginBottom: 12 }}
          >
            Crear cuenta
          </AppText>
          <AppText
            variant="bodyMedium"
            color="muted"
            style={{ textAlign: 'center', lineHeight: 22 }}
          >
            Regístrate para empezar a crear catálogos
          </AppText>
        </View>

        <View style={{ gap: 14 }}>
          {error && (
            <AppText variant="bodySmall" color="error" style={{ textAlign: 'center' }}>
              {error}
            </AppText>
          )}

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 6 }}>
              Nombre
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderDefault,
                paddingHorizontal: 14,
                height: 48,
              }}
            >
              <Ionicons name="person-outline" size={20} color={colors.textDisabled} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor={colors.textDisabled}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                style={{ flex: 1, color: colors.textPrimary, fontSize: 16, padding: 0 }}
              />
            </View>
          </View>

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 6 }}>
              Correo electrónico
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderDefault,
                paddingHorizontal: 14,
                height: 48,
              }}
            >
              <Ionicons name="mail-outline" size={20} color={colors.textDisabled} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={{ flex: 1, color: colors.textPrimary, fontSize: 16, padding: 0 }}
              />
            </View>
          </View>

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 6 }}>
              Contraseña
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderDefault,
                paddingHorizontal: 14,
                height: 48,
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.textDisabled} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={{ flex: 1, color: colors.textPrimary, fontSize: 16, padding: 0 }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textDisabled}
                />
              </Pressable>
            </View>
          </View>

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: 6 }}>
              Confirmar contraseña
            </AppText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.backgroundSecondary,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.borderDefault,
                paddingHorizontal: 14,
                height: 48,
              }}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.textDisabled} style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.textDisabled}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={{ flex: 1, color: colors.textPrimary, fontSize: 16, padding: 0 }}
              />
            </View>
          </View>

          <PrimaryButton
            label={loading ? 'Creando...' : 'Crear cuenta'}
            onPress={handleRegister}
            disabled={loading}
          />

          <SecondaryButton
            label="Ya tengo cuenta"
            onPress={() => navigate('Login')}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
