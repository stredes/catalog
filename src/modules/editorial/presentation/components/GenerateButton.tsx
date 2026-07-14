import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';

type Props = {
  label?: string;
  onPress: () => void;
  compact?: boolean;
};

export function GenerateButton({ label, onPress, compact }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: compact ? 8 : 10,
        paddingHorizontal: compact ? 12 : 16,
        borderRadius: radius.md,
        backgroundColor: colors.primary + '10',
        borderWidth: 1,
        borderColor: colors.primary + '25',
        opacity: pressed ? 0.7 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Ionicons name="sparkles" size={compact ? 14 : 16} color={colors.primary} />
      <AppText
        variant={compact ? 'caption' : 'labelMedium'}
        color="accent"
      >
        {label ?? 'Generar automáticamente'}
      </AppText>
    </Pressable>
  );
}
