import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { spacing } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';

export function WizardStep({ step, total, title, children }: PropsWithChildren<{
  step: number;
  total: number;
  title: string;
}>) {
  const colors = c();
  return (
    <View>
      <View style={styles.wizardProgress}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.wizardDot,
              {
                backgroundColor: i < step ? colors.primary : i === step ? colors.primary + '60' : colors.borderDefault,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
      <AppText variant="headingMedium" color="primary" style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>{title}</AppText>
      {children}
    </View>
  );
}
