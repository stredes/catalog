import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography } from '../theme';

interface PhotoPickerProps {
  value: string | null;
  onChange: (uri: string | null) => void;
  label?: string;
}

export function PhotoPicker({ value, onChange, label }: PhotoPickerProps) {
  const handlePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  const handleRemove = () => onChange(null);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.button} onPress={handlePick} activeOpacity={0.7}>
        <Text style={styles.buttonText}>{value ? 'Cambiar foto' : 'Agregar foto'}</Text>
      </TouchableOpacity>
      {value && (
        <View style={styles.previewRow}>
          <Image source={{ uri: value }} style={styles.preview} />
          <TouchableOpacity onPress={handleRemove}>
            <Text style={styles.removeText}>Quitar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: typography.label,
  button: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  buttonText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  preview: { width: 72, height: 72, borderRadius: borderRadius.md },
  removeText: { color: colors.danger, fontWeight: '500', fontSize: 13 },
});
