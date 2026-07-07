import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface ChipOption<T extends string> {
  label: string;
  value: T;
}

interface ChipSelectorProps<T extends string> {
  label?: string;
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function ChipSelector<T extends string>({ label, options, selected, onSelect }: ChipSelectorProps<T>) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, selected === opt.value && styles.chipSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selected === opt.value && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: typography.label,
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.chipBg,
  },
  chipSelected: { backgroundColor: colors.chipSelectedBg },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  chipTextSelected: { color: colors.white },
});
