import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productCode: z.string().optional(),
  unitPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  format: z.string(),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>;

export const orderSchema = z.object({
  clientName: z.string().min(2, 'Nombre del cliente requerido'),
  notes: z.string().optional(),
});

export type OrderInputDto = z.infer<typeof orderSchema>;
