import { describe, expect, it } from 'vitest';
import { invoiceSchema } from '../application/dtos/InvoiceDtos';

const validBase = {
  invoiceNumber: 'F-001',
  invoiceDate: '2026-08-01',
  clientName: 'Juan Perez',
  netAmount: 10000,
  status: 'pending',
};

describe('invoiceSchema', () => {
  it('acepta una factura pendiente valida', () => {
    const result = invoiceSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rechaza numero de factura vacio', () => {
    const result = invoiceSchema.safeParse({ ...validBase, invoiceNumber: '  ' });
    expect(result.success).toBe(false);
  });

  it('rechaza monto neto no entero', () => {
    const result = invoiceSchema.safeParse({ ...validBase, netAmount: 100.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path.includes('netAmount'));
      expect(error?.message).toBe('El monto neto debe ser un valor entero');
    }
  });

  it('rechaza monto neto cero o negativo', () => {
    expect(invoiceSchema.safeParse({ ...validBase, netAmount: 0 }).success).toBe(false);
    expect(invoiceSchema.safeParse({ ...validBase, netAmount: -5 }).success).toBe(false);
  });

  it('rechaza fecha con formato invalido', () => {
    const result = invoiceSchema.safeParse({ ...validBase, invoiceDate: '01/08/2026' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path.includes('invoiceDate'));
      expect(error?.message).toBe('Usa una fecha valida con formato AAAA-MM-DD');
    }
  });

  it('rechaza factura pagada sin paymentDate', () => {
    const result = invoiceSchema.safeParse({ ...validBase, status: 'paid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find((i) => i.path.includes('paymentDate'));
      expect(error?.message).toBe('Ingresa la fecha en que el dinero cayo en cuenta');
    }
  });

  it('acepta factura pagada con paymentDate valido', () => {
    const result = invoiceSchema.safeParse({
      ...validBase,
      status: 'paid',
      paymentDate: '2026-08-05',
    });
    expect(result.success).toBe(true);
  });
});
