import { describe, expect, it } from 'vitest';
import { calculateInvoiceTotal, calculateTax } from '../domain/services/invoiceCalculations';

describe('invoiceCalculations', () => {
  it('calcula IVA 19% redondeado', () => {
    expect(calculateTax(10000)).toBe(1900);
    expect(calculateTax(500)).toBe(95);
  });

  it('redondea el IVA de montos no divisibles', () => {
    expect(calculateTax(333)).toBe(63);
  });

  it('calcula el total como neto + IVA', () => {
    const netAmount = 50000;
    const taxAmount = calculateTax(netAmount);
    expect(calculateInvoiceTotal(netAmount, taxAmount)).toBe(59500);
  });
});
