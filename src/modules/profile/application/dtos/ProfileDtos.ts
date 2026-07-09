import { z } from 'zod';

export const profileSchema = z.object({
  businessName: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
  ownerName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Correo invalido').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  website: z.string().trim().optional(),
  logoUri: z.string().optional(),
});

export type ProfileInputDto = z.infer<typeof profileSchema>;
