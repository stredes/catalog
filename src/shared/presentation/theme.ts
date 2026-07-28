import { ViewStyle } from 'react-native';

export { lightColors as palette, darkColors as darkPalette } from './theme/colors';
export type { ThemeColors } from './theme/colors';
export { spacing } from './theme/spacing';
export { typography, fontWeights } from './theme/typography';
export type { TypographyVariant } from './theme/typography';
export { radius as borderRadius } from './theme/radius';
export { borders } from './theme/borders';
export { motion } from './theme/motion';
export { sizes } from './theme/sizes';
export { opacity } from './theme/opacity';
export { zIndex } from './theme/zIndex';

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  } as ViewStyle,
  xl: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  } as ViewStyle,
} as const;
