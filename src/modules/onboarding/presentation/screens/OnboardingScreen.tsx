import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../../../bootstrap/navigation';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { AppText, PrimaryButton } from '../../../../shared/presentation/components/ui';

const ONBOARDING_KEY = 'catalog_clean_onboarding_completed';

const slides = [
  {
    icon: 'albums-outline' as const,
    title: 'Catalog Clean',
    subtitle: 'Gestiona tu inventario y genera catálogos profesionales en minutos.',
  },
  {
    icon: 'camera-outline' as const,
    title: 'Captura productos',
    subtitle: 'Toma fotos, define precios y organiza todo por familias.',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Genera PDFs',
    subtitle: 'Crea catálogos listos para compartir por WhatsApp o email.',
  },
];

export function OnboardingScreen() {
  const { navigate } = useAppNavigation();
  const { services } = useDependencies();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState(0);

  const isLast = current === slides.length - 1;

  async function complete() {
    await services.preferences.setBoolean(ONBOARDING_KEY, true);
    navigate('Dashboard');
  }

  function next() {
    if (isLast) {
      complete();
    } else {
      setCurrent((prev) => prev + 1);
    }
  }

  const slide = slides[current];

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
          <Ionicons name={slide.icon} size={48} color={colors.primary} />
        </View>
        <AppText
          variant="headingLarge"
          color="primary"
          style={{ textAlign: 'center', marginBottom: 12 }}
        >
          {slide.title}
        </AppText>
        <AppText
          variant="bodyMedium"
          color="muted"
          style={{ textAlign: 'center', lineHeight: 22 }}
        >
          {slide.subtitle}
        </AppText>
      </View>

      <View style={{ alignItems: 'center', gap: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === current ? colors.primary : colors.borderDefault,
              }}
            />
          ))}
        </View>

        <PrimaryButton label={isLast ? 'Comenzar' : 'Siguiente'} onPress={next} />

        {!isLast && (
          <Pressable onPress={complete}>
            <AppText variant="labelMedium" color="muted" style={{ paddingVertical: 8 }}>
              Omitir
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
