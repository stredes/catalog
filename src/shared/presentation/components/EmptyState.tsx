import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📦</Text>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48 },
  icon: { fontSize: 40, marginBottom: 12 },
  text: { fontSize: 15, color: colors.textTertiary, textAlign: 'center' },
});
