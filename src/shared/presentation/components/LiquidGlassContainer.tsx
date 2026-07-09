import { PropsWithChildren, useMemo } from 'react';
import { ViewStyle, Platform } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { lightColors, darkColors } from '../theme/colors';
import { borderRadius } from '../theme';

type ColorScheme = 'light' | 'dark';

let currentScheme: ColorScheme = 'light';

export function setLiquidGlassScheme(scheme: ColorScheme) {
  currentScheme = scheme;
}

function c() {
  return currentScheme === 'dark' ? darkColors : lightColors;
}

export type LiquidGlassVariant = 'header' | 'tabBar' | 'floating' | 'cardSubtle';

type VariantConfig = {
  tint: BlurTint;
  intensity: number;
  background: string;
  borderColor: string;
  radius: number;
  shadowStyle: ViewStyle;
};

const configs: Record<LiquidGlassVariant, (isDark: boolean, colors: typeof lightColors) => VariantConfig> = {
  header: (isDark) => ({
    tint: isDark ? 'dark' : 'light',
    intensity: 30,
    background: isDark ? 'rgba(30, 41, 59, 0.82)' : 'rgba(15, 23, 42, 0.85)',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.10)',
    radius: borderRadius.lg,
    shadowStyle: {
      shadowColor: isDark ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
  }),
  tabBar: (isDark, colors) => ({
    tint: isDark ? 'dark' : 'light',
    intensity: 40,
    background: isDark ? 'rgba(30, 41, 59, 0.72)' : 'rgba(248, 250, 252, 0.75)',
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    radius: borderRadius.lg,
    shadowStyle: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 8,
      elevation: 8,
    },
  }),
  floating: (isDark, colors) => ({
    tint: isDark ? 'dark' : 'light',
    intensity: 45,
    background: isDark ? 'rgba(30, 41, 59, 0.78)' : 'rgba(255, 255, 255, 0.80)',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    radius: borderRadius.xl,
    shadowStyle: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  }),
  cardSubtle: (isDark, colors) => ({
    tint: isDark ? 'dark' : 'light',
    intensity: 18,
    background: isDark ? 'rgba(30, 41, 59, 0.55)' : 'rgba(255, 255, 255, 0.60)',
    borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    radius: borderRadius.lg,
    shadowStyle: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
  }),
};

export function LiquidGlassContainer({
  children,
  variant = 'cardSubtle',
  style,
}: PropsWithChildren<{
  variant?: LiquidGlassVariant;
  style?: ViewStyle | ViewStyle[];
}>) {
  const isDark = currentScheme === 'dark';
  const colors = c();
  const cfg = useMemo(() => configs[variant](isDark, colors as any), [variant, isDark, colors]);

  const baseStyle: ViewStyle = {
    backgroundColor: cfg.background,
    borderColor: cfg.borderColor,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderRadius: cfg.radius,
    overflow: 'hidden',
    ...cfg.shadowStyle,
  };

  return (
    <BlurView intensity={cfg.intensity} tint={cfg.tint} style={[baseStyle, style].flat() as unknown as ViewStyle}>
      {children}
    </BlurView>
  );
}
