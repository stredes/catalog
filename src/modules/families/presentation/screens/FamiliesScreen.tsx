import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { BottomMenu } from '../../../../shared/presentation/components/BottomMenu';
import {
  AppText,
  BottomSheet,
  EmptyStateIllustrated,
  FamilyCard,
  Header,
  Input,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Section,
} from '../../../../shared/presentation/components/ui';
import { FamilyInputDto, familySchema } from '../../application/dtos/FamilyDtos';
import { Family } from '../../domain/entities/Family';
import { useFamilies } from '../hooks/useFamilies';
import { useThemeColors } from '../../../../shared/presentation/ThemeContext';
import { useProducts } from '../../../products/presentation/hooks/useProducts';

export function FamiliesScreen() {
  const colors = useThemeColors();
  const { useCases } = useDependencies();
  const { families, reload } = useFamilies();
  const { products } = useProducts();
  const [editing, setEditing] = useState<Family | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const familyColors = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.error,
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
  ];
  const form = useForm<FamilyInputDto>({
    defaultValues: { name: '' },
    resolver: zodResolver(familySchema),
  });

  const productCountByFamily = useMemo(() => {
    const map = new Map<string, number>();
    families.forEach((f) => map.set(f.id, 0));
    products.forEach((p) => {
      map.set(p.familyId, (map.get(p.familyId) ?? 0) + 1);
    });
    return map;
  }, [families, products]);

  async function submit(input: FamilyInputDto) {
    try {
      setError('');

      if (editing) {
        await useCases.updateFamily.execute(editing.id, input);
      } else {
        await useCases.createFamily.execute(input);
      }

      setEditing(null);
      setShowForm(false);
      form.reset({ name: '' });
      await reload();
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'No se pudo guardar la familia.',
      );
    }
  }

  function startEdit(family: Family) {
    setEditing(family);
    setShowForm(true);
    form.reset({ name: family.name });
  }

  async function remove(id: string) {
    Alert.alert('Eliminar familia', 'También se eliminarán sus productos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await useCases.deleteFamily.execute(id);
          await reload();
        },
      },
    ]);
  }

  return (
    <>
      <Screen>
        <Header
          eyebrow="Familias"
          title="Organización"
          subtitle="Agrupa tus productos en familias para filtrar y generar catálogos."
        />

        {families.length === 0 ? (
          <EmptyStateIllustrated
            icon="folder-open-outline"
            title="Sin familias"
            subtitle="Crea tu primera familia para organizar los productos."
            action={
              <PrimaryButton
                label="Crear familia"
                icon="add-circle-outline"
                onPress={() => {
                  setEditing(null);
                  form.reset({ name: '' });
                  setShowForm(true);
                }}
              />
            }
          />
        ) : (
          <Section
            title={`${families.length} familias`}
            action={
              <Pressable
                onPress={() => {
                  setEditing(null);
                  form.reset({ name: '' });
                  setShowForm(true);
                }}
              >
                <AppText variant="labelLarge" color="accent">+ Nueva</AppText>
              </Pressable>
            }
          >
            {families.map((family, index) => (
              <View key={family.id} style={{ marginBottom: 10 }}>
                <FamilyCard
                  name={family.name}
                  productCount={productCountByFamily.get(family.id) ?? 0}
                  color={familyColors[index % familyColors.length]}
                  onEdit={() => startEdit(family)}
                  onDelete={() => remove(family.id)}
                />
              </View>
            ))}
          </Section>
        )}

        {error ? <AppText variant="bodySmall" color="error" style={{ fontWeight: '600' } as any}>{error}</AppText> : null}
      </Screen>

      <BottomSheet
        visible={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? 'Editar familia' : 'Nueva familia'}
      >
        <Input
          label="Nombre de la familia"
          placeholder="Ej: Bebidas, Lácteos..."
          value={form.watch('name')}
          onChangeText={(t) => form.setValue('name', t)}
          error={form.formState.errors.name?.message}
        />
        <PrimaryButton
          label={editing ? 'Guardar cambios' : 'Crear familia'}
          icon="save-outline"
          onPress={form.handleSubmit(submit)}
        />
        <View style={{ height: 8 }} />
        <SecondaryButton label="Cancelar" onPress={() => { setShowForm(false); setEditing(null); }} />
      </BottomSheet>

      <BottomMenu />
    </>
  );
}
