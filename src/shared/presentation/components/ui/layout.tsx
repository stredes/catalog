import { PropsWithChildren } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';
import { LiquidGlassContainer } from '../LiquidGlassContainer';

export function Screen({ children, style, contentBottomPadding }: PropsWithChildren<{ style?: ViewStyle; contentBottomPadding?: number }>) {
  const colors = c();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safeArea, { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: contentBottomPadding ?? (140 + insets.bottom) }, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export const AppScreen = Screen;

export function Header({ title, subtitle, eyebrow, action }: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  const colors = c();
  return (
    <LiquidGlassContainer variant="header" style={styles.header}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <AppText variant="caption" color="inverse" style={{ marginBottom: spacing.xs, opacity: 0.65 }}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText variant="headingLarge" color="inverse">{title}</AppText>
          {subtitle ? (
            <AppText variant="bodySmall" color="inverse" style={{ marginTop: spacing.xs, opacity: 0.75 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {action ? <View style={{ marginLeft: spacing.md }}>{action}</View> : null}
      </View>
    </LiquidGlassContainer>
  );
}

export function Section({ title, action, children }: PropsWithChildren<{
  title: string;
  action?: React.ReactNode;
}>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="headingSmall" color="primary">{title}</AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Divider() {
  const colors = c();
  return <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />;
}

export function AppDivider() {
  return <Divider />;
}
