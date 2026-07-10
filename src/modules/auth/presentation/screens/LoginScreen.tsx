import { useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { AppText, PrimaryButton } from '../../../../shared/presentation/components/ui';

const USER_KEY = 'catalog_clean_user';

export function LoginScreen() {
  const { navigate } = useAppNavigation();
  const { services } = useDependencies();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      setError(null);
      const user = await services.auth.signIn();
      await services.preferences.setString(USER_KEY, JSON.stringify(user));
      navigate('Onboarding');
    } catch (e: any) {
      setError('No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
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
          <Ionicons name="person-outline" size={48} color={colors.primary} />
        </View>
        <AppText
          variant="headingLarge"
          color="primary"
          style={{ textAlign: 'center', marginBottom: 12 }}
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

      <View style={{ gap: 16 }}>
        {error && (
          <AppText variant="bodySmall" color="error" style={{ textAlign: 'center' }}>
            {error}
          </AppText>
        )}

        <PrimaryButton
          label={loading ? 'Iniciando...' : 'Continuar con Google'}
          onPress={handleGoogleLogin}
          disabled={loading}
        />
      </View>
    </View>
  );
}
