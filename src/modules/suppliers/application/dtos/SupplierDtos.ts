import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type SupplierInputDto = z.infer<typeof supplierSchema>;
