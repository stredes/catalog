import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  format: z.enum(['grid-2', 'grid-3', 'list', 'premium']),
  photoUri: z.string().nullable(),
  familyId: z.string().min(1, 'La familia es requerida'),
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
