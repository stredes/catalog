import { PropsWithChildren } from 'react';
import { Text, View, TextStyle } from 'react-native';
import { fontWeights, typography as typo } from '../../theme';
import { TypographyVariant } from '../../theme/typography';
import { c, styles } from './shared';

type AppTextColor = 'primary' | 'secondary' | 'muted' | 'disabled' | 'inverse' | 'accent' | 'info' | 'success' | 'warning' | 'error';

const colorMap: Record<AppTextColor, keyof ReturnType<typeof c>> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  muted: 'textMuted',
  disabled: 'textDisabled',
  inverse: 'textInverse',
  accent: 'textAccent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export function AppText({
  variant = 'bodyMedium',
  color = 'primary',
  weight,
  style,
  numberOfLines,
  children,
}: PropsWithChildren<{
  variant?: TypographyVariant;
  color?: AppTextColor;
  weight?: keyof typeof fontWeights;
  style?: TextStyle;
  numberOfLines?: number;
}>) {
  const colors = c();
  const token = typo[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: token.fontSize,
          fontWeight: weight ? fontWeights[weight] : token.fontWeight,
          lineHeight: token.lineHeight,
          letterSpacing: 'letterSpacing' in token ? token.letterSpacing : undefined,
          color: colors[colorMap[color]],
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Badge({ label, children, color, testID }: {
  label?: string;
  children?: React.ReactNode;
  color?: string;
  testID?: string;
}) {
  const colors = c();
  const badgeColor = color ?? colors.primary;
  const content = label ?? children ?? '';
  return (
    <View style={[styles.badge, { backgroundColor: badgeColor + '18' }]} testID={testID}>
      <AppText variant="caption" color="muted" style={{ color: badgeColor } as TextStyle}>{content}</AppText>
    </View>
  );
}

export function StatusBadge({ label, tone = 'info', variant, size }: {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger';
  variant?: 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
}) {
  const colors = c();
  const toneColor = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[tone];

  return <Badge label={label} color={toneColor} />;
}
