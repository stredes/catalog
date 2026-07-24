import { useRef, useEffect, PropsWithChildren } from 'react';
import { Pressable, ScrollView, View, Animated } from 'react-native';
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
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 400,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [visible, translateY]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBg} onPress={onClose} />
      <Animated.View style={[styles.bottomSheet, { backgroundColor: colors.backgroundElevated, transform: [{ translateY }] }]}>
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
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBg} onPress={onCancel} />
      <View style={[styles.dialog, { backgroundColor: colors.backgroundElevated }]}>
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
      </View>
    </View>
  );
}
