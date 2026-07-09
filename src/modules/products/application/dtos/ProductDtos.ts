import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
  code: z.string().trim().optional(),
  price: z.coerce.number().positive('El precio debe ser mayor a cero'),
  format: z.enum(['unit', 'box', 'pack', 'service']),
  photoUri: z.string().optional(),
  familyId: z.string().min(1, 'Selecciona una familia'),
});

export type ProductInputDto = z.infer<typeof productSchema>;
