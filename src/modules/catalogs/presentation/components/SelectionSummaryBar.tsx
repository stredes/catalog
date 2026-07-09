import { View } from 'react-native';
import { AppText, PrimaryButton } from '../../../../shared/presentation/components/ui';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { spacing } from '../../../../shared/presentation/theme/spacing';
import { radius } from '../../../../shared/presentation/theme/radius';

type SelectionSummaryBarProps = {
  selectedFamiliesCount: number;
  totalProductsCount: number;
  excludedProductsCount: number;
  onContinue: () => void;
  canContinue: boolean;
};

export function SelectionSummaryBar({
  selectedFamiliesCount,
  totalProductsCount,
  excludedProductsCount,
  onContinue,
  canContinue,
}: SelectionSummaryBarProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: radius.xl,
        backgroundColor: colors.backgroundElevated,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        marginTop: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="bodyMedium" color="primary" weight="semiBold">
          Familias: {selectedFamiliesCount}
        </AppText>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
          <AppText variant="bodySmall" color="accent" weight="semiBold">
            {totalProductsCount} productos
          </AppText>
          {excludedProductsCount > 0 ? (
            <AppText variant="bodySmall" color="muted">
              {excludedProductsCount} excluidos
            </AppText>
          ) : null}
        </View>
      </View>

      <PrimaryButton
        label="Continuar"
        onPress={onContinue}
        disabled={!canContinue}
      />
    </View>
  );
}
