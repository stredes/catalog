import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing, borderRadius, sizes, borders, typography } from '../../../../shared/presentation/theme';
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

  const inputStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: borders.thin,
    borderColor: colors.borderDefault,
    paddingHorizontal: sizes.inputPaddingHorizontal,
    height: sizes.inputHeight,
  };

  const inputTextStyle = { flex: 1, color: colors.textPrimary, fontSize: typography.bodyLarge.fontSize, lineHeight: typography.bodyLarge.lineHeight, padding: 0 };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.backgroundPrimary,
          paddingTop: insets.top + spacing.xxxxl,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingHorizontal: spacing.xxxl,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: sizes.authAvatar,
              height: sizes.authAvatar,
              borderRadius: sizes.authAvatarRadius,
              backgroundColor: colors.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.xxxl,
            }}
          >
            <Ionicons name="person-add-outline" size={sizes.authIconLarge} color={colors.primary} />
          </View>
          <AppText
            variant="headingLarge"
            color="primary"
            style={{ textAlign: 'center', marginBottom: spacing.md }}
          >
            Crear cuenta
          </AppText>
          <AppText
            variant="bodyMedium"
            color="muted"
            style={{ textAlign: 'center', lineHeight: typography.headingSmall.lineHeight }}
          >
            Regístrate para empezar a crear catálogos
          </AppText>
        </View>

        <View style={{ gap: spacing.lg - 2 }}>
          {error && (
            <AppText variant="bodySmall" color="error" style={{ textAlign: 'center' }}>
              {error}
            </AppText>
          )}

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: spacing.xs + 2 }}>
              Nombre
            </AppText>
            <View style={inputStyle}>
              <Ionicons name="person-outline" size={sizes.authIconInput} color={colors.textDisabled} style={{ marginRight: sizes.iconMargin }} />
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor={colors.textDisabled}
                value={name}
                onChangeText={setName}
                autoComplete="name"
                style={inputTextStyle}
              />
            </View>
          </View>

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: spacing.xs + 2 }}>
              Correo electrónico
            </AppText>
            <View style={inputStyle}>
              <Ionicons name="mail-outline" size={sizes.authIconInput} color={colors.textDisabled} style={{ marginRight: sizes.iconMargin }} />
              <TextInput
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={inputTextStyle}
              />
            </View>
          </View>

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: spacing.xs + 2 }}>
              Contraseña
            </AppText>
            <View style={inputStyle}>
              <Ionicons name="lock-closed-outline" size={sizes.authIconInput} color={colors.textDisabled} style={{ marginRight: sizes.iconMargin }} />
              <TextInput
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={inputTextStyle}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={sizes.authIconInput}
                  color={colors.textDisabled}
                />
              </Pressable>
            </View>
          </View>

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: spacing.xs + 2 }}>
              Confirmar contraseña
            </AppText>
            <View style={inputStyle}>
              <Ionicons name="lock-closed-outline" size={sizes.authIconInput} color={colors.textDisabled} style={{ marginRight: sizes.iconMargin }} />
              <TextInput
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.textDisabled}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={inputTextStyle}
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
