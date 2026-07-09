import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { AppText } from './ui';
import { c } from './ui';

export function FormInput<T extends FieldValues>({
  control,
  name,
  error,
  ...inputProps
}: TextInputProps & {
  control: Control<T, any, any>;
  name: Path<T>;
  error?: string;
}) {
  const colors = c();
  return (
    <>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.backgroundSurface, borderColor: colors.borderDefault, color: colors.textPrimary }]}
            value={value === undefined || value === null ? '' : String(value)}
            onChangeText={onChange}
            {...inputProps}
          />
        )}
      />
      {error ? <AppText variant="bodySmall" color="error" style={{ marginTop: 4 } as any}>{error}</AppText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
});
