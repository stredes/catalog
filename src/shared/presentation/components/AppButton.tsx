import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'outline' | 'ghost';
  style?: ViewStyle;
}

export function AppButton({ title, onPress, disabled, loading, variant = 'primary', style }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isDanger && styles.danger,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.primary : colors.white} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.primaryText,
            isDanger && styles.dangerText,
            isOutline && styles.outlineText,
            isGhost && styles.ghostText,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: { backgroundColor: colors.primary, ...shadows.sm },
  danger: { backgroundColor: colors.danger, ...shadows.sm },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '600' },
  primaryText: { color: colors.white },
  dangerText: { color: colors.white },
  outlineText: { color: colors.primary },
  ghostText: { color: colors.primary },
  disabledText: { opacity: 0.6 },
});
