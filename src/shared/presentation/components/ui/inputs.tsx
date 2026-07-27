import { View, TextInput, Pressable, TextStyle } from 'react-native';
import { Ionicons } from '../Icon';
import { spacing } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';

export function SearchInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) {
  const colors = c();
  return (
    <View style={[styles.searchBar, { backgroundColor: colors.backgroundSurface, borderColor: colors.borderDefault }]}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Buscar...'}
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.textPrimary }]}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export const SearchBar = SearchInput;
export const SearchField = SearchInput;

export function FilterChip({ label, selected, onPress }: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = c();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.backgroundSurface,
          borderColor: selected ? colors.primary : colors.borderDefault,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? 'inverse' : 'muted'} style={{ color: selected ? colors.textInverse : colors.textSecondary } as TextStyle}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ChoiceChip({ label, selected, onPress, color }: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  color?: string;
}) {
  const colors = c();
  const chipColor = color ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? chipColor : colors.backgroundSurface,
          borderColor: selected ? chipColor : colors.borderDefault,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText variant="caption" color={selected ? 'inverse' : 'muted'} style={{ color: selected ? colors.textInverse : colors.textSecondary } as TextStyle}>
        {label}
      </AppText>
    </Pressable>
  );
}

export const AppChip = ChoiceChip;

export function Input({ label, error, ...props }: {
  label?: string;
  error?: string;
} & React.ComponentProps<typeof TextInput>) {
  const colors = c();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <AppText variant="labelMedium" color="muted" style={{ marginBottom: spacing.xs }}>{label}</AppText> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundSurface,
            borderColor: error ? colors.error : colors.borderDefault,
            color: colors.textPrimary,
          },
        ]}
        {...props}
      />
      {error ? <AppText variant="bodySmall" color="error" style={{ marginTop: spacing.xs }}>{error}</AppText> : null}
    </View>
  );
}
