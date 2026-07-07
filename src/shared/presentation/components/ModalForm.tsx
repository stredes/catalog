import React, { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface ModalFormProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  children: ReactNode;
}

export function ModalForm({ visible, title, onCancel, onSave, saveLabel = 'Guardar', children }: ModalFormProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton title="Cancelar" variant="outline" onPress={onCancel} style={{ flex: 1 }} />
            <AppButton title={saveLabel} onPress={onSave} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    maxHeight: '85%',
    ...shadows.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  body: { flexGrow: 0 },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
});
