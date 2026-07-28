export const lightColors = {
  background: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EEF1F6',
  primaryPressed: '#4338CA',
  primarySoft: '#EEF0FF',
  textMutedSemantic: '#7C8594',
  border: '#E6EAF0',
  borderStrong: '#D0D6E0',
  danger: '#DC2626',
  info: '#2563EB',

  primary: '#4F46E5',
  primaryLight: '#E8E5FF',
  primaryDark: '#4338CA',

  secondary: '#0D9488',
  secondaryLight: '#E6F7F5',

  success: '#059669',
  successLight: '#E6F7F0',

  warning: '#D97706',
  warningLight: '#FFF8E6',

  error: '#DC2626',
  errorLight: '#FFE6E6',

  destructive: '#DC2626',
  destructiveLight: '#FFE6E6',

  backgroundPrimary: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  backgroundSurface: '#FFFFFF',
  backgroundElevated: '#FFFFFF',

  borderDefault: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderActive: '#4F46E5',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',
  textAccent: '#4F46E5',

  shadow: '#4F46E5',
  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;

export const darkColors = {
  background: '#0C1222',
  surface: '#151D30',
  surfaceElevated: '#1A2540',
  surfaceMuted: '#1E2A45',
  primaryPressed: '#A5B4FC',
  primarySoft: '#1E1B4B',
  textMutedSemantic: '#9CA3AF',
  border: '#2A3550',
  borderStrong: '#3D4A6B',
  danger: '#FCA5A5',
  info: '#60A5FA',

  primary: '#818CF8',
  primaryLight: '#2E2A6E',
  primaryDark: '#A5B4FC',

  secondary: '#5EEAD4',
  secondaryLight: '#134E4A',

  success: '#34D399',
  successLight: '#0A3D2A',

  warning: '#FBBF24',
  warningLight: '#3D2E00',

  error: '#F87171',
  errorLight: '#3D0A0A',

  destructive: '#FCA5A5',
  destructiveLight: '#3D0A0A',

  backgroundPrimary: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundSurface: '#1E293B',
  backgroundElevated: '#273449',

  borderDefault: '#334155',
  borderSubtle: '#1E293B',
  borderActive: '#818CF8',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',
  textInverse: '#F8FAFC',
  textAccent: '#818CF8',

  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ThemeColors = typeof lightColors;
