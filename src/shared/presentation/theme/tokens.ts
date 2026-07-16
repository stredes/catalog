// Design Tokens - Sistema de diseño completo
// Basado en mejores prácticas 2025-2026

// ─── Colores Semánticos ────────────────────────────────────────
export const colors = {
  // Primary
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Secondary
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Success
  success: {
    light: '#86efac',
    DEFAULT: '#22c55e',
    dark: '#15803d',
  },
  // Warning
  warning: {
    light: '#fde047',
    DEFAULT: '#eab308',
    dark: '#a16207',
  },
  // Error
  error: {
    light: '#fca5a5',
    DEFAULT: '#ef4444',
    dark: '#b91c1c',
  },
  // Neutral
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    1000: '#000000',
  },
} as const;

// ─── Espaciado (Base 4px) ─────────────────────────────────────
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ─── Tipografía (Scale Modular) ───────────────────────────────
export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Sombras (Elevation) ──────────────────────────────────────
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 15,
  },
} as const;

// ─── Breakpoints ──────────────────────────────────────────────
export const breakpoints = {
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// ─── Z-Index ──────────────────────────────────────────────────
export const zIndex = {
  hide: -1,
  auto: 0,
  base: 1,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1700,
  tooltip: 1800,
} as const;

// ─── Tema Claro ───────────────────────────────────────────────
export const lightTheme = {
  colors: {
    background: colors.neutral[0],
    surface: colors.neutral[50],
    surfaceVariant: colors.neutral[100],
    border: colors.neutral[200],
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[600],
      disabled: colors.neutral[400],
      inverse: colors.neutral[0],
    },
    primary: colors.primary[600],
    primaryVariant: colors.primary[700],
    secondary: colors.secondary[600],
    error: colors.error[DEFAULT],
    success: colors.success[DEFAULT],
    warning: colors.warning[DEFAULT],
    onPrimary: colors.neutral[0],
    onSecondary: colors.neutral[0],
    onError: colors.neutral[0],
  },
  spacing,
  typography,
  borderRadius,
  shadows,
  zIndex,
} as const;

// ─── Tema Oscuro ──────────────────────────────────────────────
export const darkTheme = {
  colors: {
    background: colors.neutral[900],
    surface: colors.neutral[800],
    surfaceVariant: colors.neutral[700],
    border: colors.neutral[600],
    text: {
      primary: colors.neutral[0],
      secondary: colors.neutral[300],
      disabled: colors.neutral[500],
      inverse: colors.neutral[900],
    },
    primary: colors.primary[400],
    primaryVariant: colors.primary[300],
    secondary: colors.secondary[400],
    error: colors.error[light],
    success: colors.success[light],
    warning: colors.warning[light],
    onPrimary: colors.neutral[900],
    onSecondary: colors.neutral[900],
    onError: colors.neutral[900],
  },
  spacing,
  typography,
  borderRadius,
  shadows,
  zIndex,
} as const;

export type Theme = typeof lightTheme;
