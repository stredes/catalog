import { z } from 'zod';

const RUT_BODY_REGEX = /^\d{7,8}$/;
const RUT_CLEAN_REGEX = /^[\d.]+-[\dkK]$/;

function computeRutCheckDigit(body: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const result = 11 - remainder;

  if (result === 11) return '0';
  if (result === 10) return 'K';
  return String(result);
}

export function validateRut(rut: string): boolean {
  const trimmed = rut.trim();
  if (!RUT_CLEAN_REGEX.test(trimmed)) return false;

  const parts = trimmed.split('-');
  const bodyWithDots = parts[0];
  const providedDv = parts[1].toUpperCase();
  const body = bodyWithDots.replace(/\./g, '');

  if (!RUT_BODY_REGEX.test(body)) return false;

  const expectedDv = computeRutCheckDigit(body);
  return providedDv === expectedDv;
}

export const rutValidator = z.string().refine(
  (val) => validateRut(val),
  { message: 'RUT invalido' },
);

export const clientSchema = z.object({
  name: z.string().trim().min(2, 'Nombre minimo de 2 caracteres'),
  rut: rutValidator.optional(),
  email: z.string().email('Email invalido').optional(),
  phone: z.string().min(8, 'Telefono invalido').optional(),
  address: z.string().optional(),
});

export type ClientInputDto = z.infer<typeof clientSchema>;
