import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, style, ...rest }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={colors.textTertiary}
        {...rest}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: typography.label,
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 12, color: colors.danger, marginTop: spacing.xs },
});
