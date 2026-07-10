import { z } from 'zod';

export const CHILEAN_BANKS = [
  'Banco de Chile',
  'BancoEstado',
  'Banco Santander',
  'Banco BCI',
  'Banco Itaú',
  'Banco Falabella',
  'Banco Scotiabank',
  'Banco Corpbanca',
  'Banco Security',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco Penta',
  'Banco BTG Pactual',
  'Banco Deutsche Bank',
  'Banco JP Morgan',
  'Banco ABN AMRO',
  'Banco HSBC',
  'Banco Rabobank',
  'Banco GNB Sudameris',
  'Banco COPEUCH',
  'Banco Musa',
  'Banco InterMovil',
  'Banco Tenpo',
  'Banco Mercado Pago',
  'Banco Mach',
  'Banco Fintual',
  'Otro',
] as const;

export const BANK_ACCOUNT_TYPES = [
  'Cuenta Corriente',
  'Cuenta de Ahorro',
  'Cuenta Vista',
  'Cuenta RUT',
] as const;

export const profileSchema = z.object({
  businessName: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
  ownerName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Correo invalido').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  website: z.string().trim().optional(),
  logoUri: z.string().optional(),
  bankName: z.string().trim().optional(),
  bankAccountType: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
});

export type ProfileInputDto = z.infer<typeof profileSchema>;
