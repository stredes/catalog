import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '../../../../shared/presentation/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing, borderRadius, sizes } from '../../../../shared/presentation/theme';
import { AppText, PrimaryButton, SecondaryButton } from '../../../../shared/presentation/components/ui';

export function LoginScreen() {
  const { navigate } = useAppNavigation();
  const { services } = useDependencies();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await services.auth.login(email.trim(), password);
      navigate('Onboarding');
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: spacing.lg - 2,
    height: sizes.inputHeight,
  };

  const inputTextStyle = { flex: 1, color: colors.textPrimary, fontSize: 16, padding: 0 };

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
              borderRadius: sizes.authAvatar / 2,
              backgroundColor: colors.primaryLight,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.xxxl,
            }}
          >
            <Ionicons name="person-outline" size={sizes.authIconLarge} color={colors.primary} />
          </View>
          <AppText
            variant="headingLarge"
            color="primary"
            style={{ textAlign: 'center', marginBottom: spacing.md }}
          >
            Bienvenido
          </AppText>
          <AppText
            variant="bodyMedium"
            color="muted"
            style={{ textAlign: 'center', lineHeight: 22 }}
          >
            Inicia sesión para acceder a tus catálogos
          </AppText>
        </View>

        <View style={{ gap: spacing.lg }}>
          {error && (
            <AppText variant="bodySmall" color="error" style={{ textAlign: 'center' }}>
              {error}
            </AppText>
          )}

          <View>
            <AppText variant="labelMedium" color="secondary" style={{ marginBottom: spacing.xs + 2 }}>
              Correo electrónico
            </AppText>
            <View style={inputStyle}>
              <Ionicons name="mail-outline" size={sizes.authIconInput} color={colors.textDisabled} style={{ marginRight: spacing.sm + 2 }} />
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
              <Ionicons name="lock-closed-outline" size={sizes.authIconInput} color={colors.textDisabled} style={{ marginRight: spacing.sm + 2 }} />
              <TextInput
                placeholder="Tu contraseña"
                placeholderTextColor={colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
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

          <PrimaryButton
            label={loading ? 'Iniciando...' : 'Iniciar sesión'}
            onPress={handleLogin}
            disabled={loading}
          />

          <SecondaryButton
            label="Crear cuenta"
            onPress={() => navigate('Register')}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
