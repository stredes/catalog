import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FormField } from '../../../shared/presentation/components/form/FormField';

interface ProductFormData {
  name: string;
  price: string;
  description: string;
  stock: string;
  familyId: string;
}

interface FormErrors {
  name?: string;
  price?: string;
  description?: string;
  stock?: string;
  familyId?: string;
}

const validate = (data: ProductFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido';
  } else if (data.name.length < 2) {
    errors.name = 'Mínimo 2 caracteres';
  }

  if (!data.price) {
    errors.price = 'El precio es requerido';
  } else if (isNaN(Number(data.price)) || Number(data.price) < 0) {
    errors.price = 'Precio inválido';
  }

  if (!data.description.trim()) {
    errors.description = 'La descripción es requerida';
  }

  if (!data.stock) {
    errors.stock = 'El stock es requerido';
  } else if (isNaN(Number(data.stock)) || Number(data.stock) < 0) {
    errors.stock = 'Stock inválido';
  }

  if (!data.familyId.trim()) {
    errors.familyId = 'Selecciona una familia';
  }

  return errors;
};

export function ProductFormScreen() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    description: '',
    stock: '',
    familyId: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        // Simular guardado
        await new Promise(resolve => setTimeout(resolve, 1000));
        Alert.alert('Éxito', 'Producto creado correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo guardar el producto');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Nuevo Producto</Text>

        <FormField
          label="Nombre"
          value={formData.name}
          onChangeText={v => handleChange('name', v)}
          error={errors.name}
          required
          placeholder="Nombre del producto"
        />

        <FormField
          label="Precio"
          value={formData.price}
          onChangeText={v => handleChange('price', v)}
          error={errors.price}
          required
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <FormField
          label="Descripción"
          value={formData.description}
          onChangeText={v => handleChange('description', v)}
          error={errors.description}
          required
          placeholder="Descripción del producto"
          multiline
          numberOfLines={3}
        />

        <FormField
          label="Stock"
          value={formData.stock}
          onChangeText={v => handleChange('stock', v)}
          error={errors.stock}
          required
          placeholder="0"
          keyboardType="number-pad"
        />

        <FormField
          label="Familia ID"
          value={formData.familyId}
          onChangeText={v => handleChange('familyId', v)}
          error={errors.familyId}
          required
          placeholder="ID de la familia"
        />

        <View style={styles.buttonContainer}>
          <View style={[styles.button, styles.buttonSecondary]}>
            <Text style={styles.buttonSecondaryText}>Cancelar</Text>
          </View>
          <View style={[styles.button, styles.buttonPrimary]}>
            <Text style={styles.buttonPrimaryText}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
});
