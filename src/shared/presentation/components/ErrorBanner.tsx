import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface ErrorBannerProps {
  message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  text: { fontSize: 13, color: colors.danger, fontWeight: '500' },
});
