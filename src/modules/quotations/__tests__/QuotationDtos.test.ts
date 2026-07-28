import { describe, expect, it } from 'vitest';
import { quotationInputSchema } from '../application/dtos/QuotationDtos';

const validBase = {
  clientName: 'Juan Perez',
  items: [{ description: 'Servicio de pintura', quantity: 1, unitPrice: 50000 }],
};

describe('quotationInputSchema clientRut field', () => {
  it('accepts quotation with valid clientRut', () => {
    const result = quotationInputSchema.safeParse({
      ...validBase,
      clientRut: '12.345.678-5',
    });
    expect(result.success).toBe(true);
  });

  it('accepts quotation without clientRut (optional)', () => {
    const result = quotationInputSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('accepts quotation with clientRut undefined', () => {
    const result = quotationInputSchema.safeParse({
      ...validBase,
      clientRut: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects quotation with invalid clientRut', () => {
    const result = quotationInputSchema.safeParse({
      ...validBase,
      clientRut: '12.345.678-9',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const rutError = result.error.issues.find((i) => i.path.includes('clientRut'));
      expect(rutError).toBeDefined();
      expect(rutError!.message).toBe('RUT invalido');
    }
  });

  it('rejects quotation with malformed clientRut', () => {
    const result = quotationInputSchema.safeParse({
      ...validBase,
      clientRut: 'abc-no-es-rut',
    });
    expect(result.success).toBe(false);
  });
});
