import { z } from 'zod';

export const catalogSchema = z.object({
  name: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
  familyId: z.string().min(1, 'Selecciona una familia').optional(),
  familyIds: z.array(z.string()).optional(),
  format: z.enum([
    'grid-2',
    'grid-3',
    'grid-4x5',
    'grid-3x7',
    'simple-list',
    'premium-cover',
  ]),
  productIds: z.array(z.string()).min(1, 'Selecciona al menos un producto'),
});

export type CatalogInputDto = z.infer<typeof catalogSchema>;
