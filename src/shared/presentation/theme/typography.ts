export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const typography = {
  display: { fontSize: 34, fontWeight: fontWeights.extraBold, lineHeight: 40, letterSpacing: 0 },
  heading1: { fontSize: 28, fontWeight: fontWeights.bold, lineHeight: 34, letterSpacing: 0 },
  heading2: { fontSize: 22, fontWeight: fontWeights.bold, lineHeight: 28, letterSpacing: 0 },
  heading3: { fontSize: 18, fontWeight: fontWeights.semiBold, lineHeight: 24, letterSpacing: 0 },
  title: { fontSize: 16, fontWeight: fontWeights.semiBold, lineHeight: 22, letterSpacing: 0 },
  subtitle: { fontSize: 14, fontWeight: fontWeights.medium, lineHeight: 20, letterSpacing: 0 },
  body: { fontSize: 14, fontWeight: fontWeights.regular, lineHeight: 20, letterSpacing: 0 },
  label: { fontSize: 12, fontWeight: fontWeights.semiBold, lineHeight: 16, letterSpacing: 0.4 },
  button: { fontSize: 14, fontWeight: fontWeights.semiBold, lineHeight: 18, letterSpacing: 0 },
  overline: { fontSize: 11, fontWeight: fontWeights.bold, lineHeight: 14, letterSpacing: 0.8 },

  displayLarge: { fontSize: 32, fontWeight: fontWeights.extraBold, lineHeight: 38, letterSpacing: 0 },
  headingLarge: { fontSize: 26, fontWeight: fontWeights.bold, lineHeight: 32, letterSpacing: 0 },
  headingMedium: { fontSize: 20, fontWeight: fontWeights.bold, lineHeight: 26, letterSpacing: 0 },
  headingSmall: { fontSize: 17, fontWeight: fontWeights.semiBold, lineHeight: 22 },

  bodyLarge: { fontSize: 16, fontWeight: fontWeights.regular, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: fontWeights.regular, lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: fontWeights.regular, lineHeight: 18 },

  labelLarge: { fontSize: 14, fontWeight: fontWeights.semiBold, lineHeight: 18, letterSpacing: 0.3 },
  labelMedium: { fontSize: 12, fontWeight: fontWeights.semiBold, lineHeight: 16, letterSpacing: 0.4 },

  caption: { fontSize: 11, fontWeight: fontWeights.medium, lineHeight: 14, letterSpacing: 0.5 },

  price: { fontSize: 18, fontWeight: fontWeights.extraBold, lineHeight: 22 },
  metric: { fontSize: 22, fontWeight: fontWeights.extraBold, lineHeight: 28 },
} as const;

export type TypographyVariant = keyof typeof typography;
