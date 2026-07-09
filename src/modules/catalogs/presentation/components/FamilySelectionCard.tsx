import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';
import { fontWeights } from '../../../../shared/presentation/theme/typography';

const FAMILY_COLORS = [
  '#2563EB',
  '#0EA5E9',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
];

function getFamilyColor(index: number): string {
  return FAMILY_COLORS[index % FAMILY_COLORS.length];
}

type FamilySelectionCardProps = {
  name: string;
  productCount: number;
  selected: boolean;
  colorIndex: number;
  disabled?: boolean;
  onPress: () => void;
};

export function FamilySelectionCard({
  name,
  productCount,
  selected,
  colorIndex,
  disabled = false,
  onPress,
}: FamilySelectionCardProps) {
  const colors = useThemeColors();
  const cardColor = getFamilyColor(colorIndex);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        opacity: pressed && !disabled ? 0.92 : disabled ? 0.5 : 1,
      })}
    >
      <Card
        variant="default"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          borderLeftWidth: 4,
          borderLeftColor: cardColor,
          backgroundColor: selected ? colors.primary + '08' : colors.backgroundSurface,
          borderColor: selected ? colors.borderActive : colors.borderDefault,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: cardColor + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="folder-outline" size={22} color={cardColor} />
        </View>

        <View style={{ flex: 1 }}>
          <AppText
            variant="bodyMedium"
            color="primary"
            weight="semiBold"
          >
            {name}
          </AppText>
          <AppText variant="bodySmall" color="muted">
            {productCount > 0
              ? `${productCount} producto${productCount !== 1 ? 's' : ''}`
              : 'Sin productos'}
          </AppText>
        </View>

        {productCount === 0 && !selected ? (
          <AppText variant="caption" color="disabled">
            Sin stock
          </AppText>
        ) : (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: selected ? colors.primary : colors.textDisabled,
              backgroundColor: selected ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selected ? (
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            ) : null}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
