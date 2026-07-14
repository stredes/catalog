import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Card } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';
import { EditorialTextArea } from './EditorialTextArea';
import { GenerateButton } from './GenerateButton';

type Props = {
  familyName: string;
  productCount: number;
  description: string;
  onDescriptionChange: (text: string) => void;
  onGenerate: () => void;
  disabled?: boolean;
  colorIndex?: number;
};

const ACCENT_COLORS = [
  '#2563EB', '#7C3AED', '#0EA5E9', '#059669',
  '#D97706', '#DC2626', '#DB2777', '#4F46E5',
];

export function CategoryEditorialCard({
  familyName,
  productCount,
  description,
  onDescriptionChange,
  onGenerate,
  disabled,
  colorIndex = 0,
}: Props) {
  const colors = useThemeColors();
  const accent = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];

  return (
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: accent + '18',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="folder-open" size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyMedium" color="primary" weight="semiBold">
            {familyName}
          </AppText>
          <AppText variant="caption" color="muted">
            {productCount} producto{productCount !== 1 ? 's' : ''}
          </AppText>
        </View>
      </View>

      <EditorialTextArea
        label="Descripción de la categoría"
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Describe esta categoría de productos..."
        disabled={disabled}
        numberOfLines={2}
      />

      {!disabled && (
        <GenerateButton
          label="Generar descripción"
          onPress={onGenerate}
          compact
        />
      )}
    </Card>
  );
}
