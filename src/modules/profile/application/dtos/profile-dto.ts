import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  company: z.string().min(1, 'La empresa es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
  photoUri: z.string().nullable(),
  rut: z.string().min(1, 'El RUT es requerido'),
});

export type ProfileDto = z.infer<typeof profileSchema>;
