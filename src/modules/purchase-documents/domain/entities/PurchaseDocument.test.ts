import { describe, expect, it } from 'vitest';
import { calculatePurchaseTaxes } from './PurchaseDocument';

describe('calculatePurchaseTaxes', () => {
  it('suma el IVA al precio neto ingresado', () => {
    expect(calculatePurchaseTaxes(10_000)).toEqual({
      netAmount: 10_000,
      ivaAmount: 1_900,
      total: 11_900,
    });
  });

  it('redondea el IVA a pesos completos', () => {
    expect(calculatePurchaseTaxes(999)).toEqual({
      netAmount: 999,
      ivaAmount: 190,
      total: 1_189,
    });
  });
});
