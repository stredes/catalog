import { describe, expect, it } from 'vitest';
import { quotationInputSchema, quotationUpdateSchema } from '../application/dtos/QuotationDtos';

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

describe('quotationUpdateSchema', () => {
  const validUpdate = { status: 'pending' as const };

  it('accepts each valid status value', () => {
    for (const status of ['pending', 'accepted', 'paid', 'rejected', 'deleted']) {
      const result = quotationUpdateSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status value', () => {
    const result = quotationUpdateSchema.safeParse({ status: 'draft' });
    expect(result.success).toBe(false);
  });

  it('rejects status that is not a string', () => {
    const result = quotationUpdateSchema.safeParse({ status: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts update with clientName only', () => {
    const result = quotationUpdateSchema.safeParse({
      clientName: 'Nuevo Nombre',
      status: 'accepted',
    });
    expect(result.success).toBe(true);
  });

  it('accepts update with valid clientRut', () => {
    const result = quotationUpdateSchema.safeParse({
      clientRut: '12.345.678-5',
      status: 'paid',
    });
    expect(result.success).toBe(true);
  });

  it('rejects update with invalid clientRut', () => {
    const result = quotationUpdateSchema.safeParse({
      clientRut: '12.345.678-9',
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('accepts update without clientRut', () => {
    const result = quotationUpdateSchema.safeParse({
      clientName: 'Solo nombre',
      status: 'pending',
    });
    expect(result.success).toBe(true);
  });

  it('accepts update with items array', () => {
    const result = quotationUpdateSchema.safeParse({
      items: [{ description: 'Servicio', quantity: 2, unitPrice: 10000 }],
      status: 'pending',
    });
    expect(result.success).toBe(true);
  });

  it('rejects update with empty items array', () => {
    const result = quotationUpdateSchema.safeParse({
      items: [],
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when status is missing', () => {
    const result = quotationUpdateSchema.safeParse({ clientName: 'Test' });
    expect(result.success).toBe(false);
  });
});
