import { z } from 'zod';
import { isValidISODate } from '../../../../shared/utils/dates';

export const invoiceSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1, 'Ingresa el numero de factura'),
    invoiceDate: z.string().min(1, 'Selecciona la fecha'),
    clientName: z.string().trim().min(1, 'Ingresa el cliente'),
    description: z.string().trim().optional(),
    netAmount: z
      .number()
      .int('El monto neto debe ser un valor entero')
      .positive('El monto neto debe ser mayor que cero'),
    status: z.enum(['pending', 'paid']),
    paymentDate: z.string().optional(),
  })
  .superRefine((input, context) => {
    if (!isValidISODate(input.invoiceDate)) {
      context.addIssue({
        code: 'custom',
        path: ['invoiceDate'],
        message: 'Usa una fecha valida con formato AAAA-MM-DD',
      });
    }

    if (input.status === 'paid') {
      if (!input.paymentDate || !isValidISODate(input.paymentDate)) {
        context.addIssue({
          code: 'custom',
          path: ['paymentDate'],
          message: 'Ingresa la fecha en que el dinero cayo en cuenta',
        });
      }
    }
  });

export type InvoiceInputDto = z.infer<typeof invoiceSchema>;
