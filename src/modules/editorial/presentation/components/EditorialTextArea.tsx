import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
};

export function EditorialTextArea({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = true,
  numberOfLines = 3,
  disabled = false,
}: Props) {
  const colors = useThemeColors();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText
        variant="labelMedium"
        color="muted"
        style={{ marginBottom: spacing.xs }}
      >
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        editable={!disabled}
        style={{
          borderRadius: radius.lg,
          borderWidth: 1.5,
          borderColor: disabled ? colors.borderSubtle : colors.borderDefault,
          backgroundColor: disabled ? colors.borderSubtle : colors.backgroundSurface,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 14,
          fontWeight: '400',
          color: disabled ? colors.textDisabled : colors.textPrimary,
          minHeight: multiline ? 80 : 48,
          lineHeight: 20,
        }}
      />
    </View>
  );
}
