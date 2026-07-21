import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';

type ProductSelectionCardProps = {
  name: string;
  price: string;
  format: string;
  familyName: string;
  photoUri?: string | null;
  included: boolean;
  excluded: boolean;
  onPress: () => void;
};

export function ProductSelectionCard({
  name,
  price,
  format,
  familyName,
  photoUri,
  included,
  excluded,
  onPress,
}: ProductSelectionCardProps) {
  const colors = useThemeColors();

  const formatColors: Record<string, string> = {
    unit: colors.secondary,
    box: colors.warning,
    pack: colors.success,
    service: colors.error,
  };
  const fmtColor = formatColors[format] ?? colors.primary;

  let backgroundColor = 'transparent';
  let borderColor = colors.borderDefault;

  if (excluded) {
    backgroundColor = colors.error + '08';
    borderColor = colors.error + '40';
  } else if (included) {
    backgroundColor = colors.primary + '12';
    borderColor = colors.primary + '30';
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: radius.lg,
        backgroundColor,
        borderWidth: 1,
        borderColor,
        marginBottom: 4,
      })}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.borderSubtle,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.borderSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="image-outline" size={20} color={colors.textMuted} />
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText
          variant="bodyMedium"
          color={excluded ? 'muted' : 'primary'}
          weight="semiBold"
          numberOfLines={1}
          style={{
            textDecorationLine: excluded ? 'line-through' : 'none',
          }}
        >
          {name}
        </AppText>
        <AppText variant="bodySmall" color="muted" numberOfLines={1}>
          {familyName} · {format}
        </AppText>
      </View>

      <AppText
        variant="price"
        color={excluded ? 'disabled' : 'accent'}
        style={{
          textDecorationLine: excluded ? 'line-through' : 'none',
        }}
      >
        {price}
      </AppText>

      {excluded ? (
        <Ionicons name="close-circle" size={20} color={colors.error} />
      ) : included ? (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={14} color={colors.textInverse} />
        </View>
      ) : (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: colors.textDisabled,
          }}
        />
      )}
    </Pressable>
  );
}
