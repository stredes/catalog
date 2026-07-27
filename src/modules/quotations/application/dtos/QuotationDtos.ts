import { z } from 'zod';

export const serviceItemInputSchema = z.object({
  description: z.string().min(1, 'Descripcion requerida'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().positive('El precio debe ser mayor a 0'),
});

export type ServiceItemInputDto = z.infer<typeof serviceItemInputSchema>;

export const quotationInputSchema = z.object({
  clientName: z.string().min(2, 'Nombre del cliente requerido'),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email('Email invalido').optional().or(z.literal('')).optional(),
  clientAddress: z.string().optional(),
  items: z.array(serviceItemInputSchema).min(1, 'Agrega al menos un servicio'),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

export type QuotationInputDto = z.infer<typeof quotationInputSchema>;
