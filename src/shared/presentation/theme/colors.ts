export const lightColors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',

  secondary: '#0EA5E9',

  success: '#22C55E',
  successLight: '#DCFCE7',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  error: '#EF4444',
  errorLight: '#FEE2E2',

  destructive: '#DC2626',
  destructiveLight: '#FEE2E2',

  backgroundPrimary: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  backgroundSurface: '#FFFFFF',
  backgroundElevated: '#FFFFFF',

  borderDefault: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderActive: '#2563EB',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',
  textAccent: '#2563EB',

  shadow: '#0F172A',
  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;

export const darkColors = {
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  primaryDark: '#60A5FA',

  secondary: '#38BDF8',

  success: '#4ADE80',
  successLight: '#14532D',

  warning: '#FBBF24',
  warningLight: '#451A03',

  error: '#F87171',
  errorLight: '#450A0A',

  destructive: '#FCA5A5',
  destructiveLight: '#450A0A',

  backgroundPrimary: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundSurface: '#1E293B',
  backgroundElevated: '#273449',

  borderDefault: '#334155',
  borderSubtle: '#1E293B',
  borderActive: '#3B82F6',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',
  textInverse: '#F8FAFC',
  textAccent: '#3B82F6',

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ThemeColors = typeof lightColors;
