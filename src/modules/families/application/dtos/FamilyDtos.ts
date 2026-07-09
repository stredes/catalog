import { z } from 'zod';

export const familySchema = z.object({
  name: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
});

export type FamilyInputDto = z.infer<typeof familySchema>;
