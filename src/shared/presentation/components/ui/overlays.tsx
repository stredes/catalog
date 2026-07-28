import { useEffect, PropsWithChildren } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';
import { c, styles } from './shared';
import { AppText } from './text';

export function BottomSheet({ visible, onClose, title, children, stickyFooter }: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  stickyFooter?: React.ReactNode;
}>) {
  const colors = c();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(400);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 400, { damping: 16, stiffness: 120 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBg} onPress={onClose} />
      <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.backgroundElevated }, sheetStyle]}>
        <View style={[styles.bottomSheetHandle, { backgroundColor: colors.borderDefault }]} />
        {title ? <AppText variant="headingSmall" color="primary" style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>{title}</AppText> : null}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: stickyFooter ? 0 : insets.bottom }}>
          <View style={{ padding: spacing.xl }}>{children}</View>
        </ScrollView>
        {stickyFooter ? (
          <View style={[styles.bottomSheetFooter, { paddingBottom: insets.bottom, backgroundColor: colors.backgroundElevated }]}>
            {stickyFooter}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

export function ConfirmDialog({ visible, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive }: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  const colors = c();
  const dialogScale = useSharedValue(0.92);
  const dialogOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      dialogScale.value = withSpring(1, { damping: 16, stiffness: 160 });
      dialogOpacity.value = withSpring(1, { damping: 16, stiffness: 160 });
    }
  }, [visible, dialogScale, dialogOpacity]);

  const dialogStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dialogScale.value }],
    opacity: dialogOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBg} onPress={onCancel} />
      <Animated.View style={[styles.dialog, { backgroundColor: colors.backgroundElevated }, dialogStyle]}>
        <AppText variant="headingSmall" color="primary" style={{ textAlign: 'center' }}>{title}</AppText>
        <AppText variant="bodyMedium" color="muted" style={{ textAlign: 'center', marginTop: spacing.md }}>{message}</AppText>
        <View style={styles.dialogActions}>
          <Pressable onPress={onCancel} style={[styles.dialogButton, { backgroundColor: colors.borderSubtle }]}>
            <AppText variant="labelLarge" color="muted">{cancelLabel ?? 'Cancelar'}</AppText>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[styles.dialogButton, { backgroundColor: destructive ? colors.destructive : colors.primary }]}
          >
            <AppText variant="labelLarge" color="inverse">{confirmLabel ?? 'Confirmar'}</AppText>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
