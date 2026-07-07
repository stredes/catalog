import { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#007AFF',
  primaryLight: '#E3F2FD',
  danger: '#D32F2F',
  dangerLight: '#FFEBEE',
  success: '#2E7D32',
  warning: '#F57C00',
  white: '#FFFFFF',
  background: '#F2F4F8',
  surface: '#FFFFFF',
  border: '#DDE1E6',
  borderLight: '#E8EAED',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  chipBg: '#E8EAED',
  chipSelectedBg: '#007AFF',
  overlay: 'rgba(0, 0, 0, 0.45)',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 } as TextStyle,
  h2: { fontSize: 20, fontWeight: '700', color: colors.textPrimary } as TextStyle,
  h3: { fontSize: 16, fontWeight: '600', color: colors.textPrimary } as TextStyle,
  body: { fontSize: 15, color: colors.textPrimary } as TextStyle,
  caption: { fontSize: 13, color: colors.textSecondary } as TextStyle,
  small: { fontSize: 12, color: colors.textTertiary } as TextStyle,
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs } as TextStyle,
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
};
