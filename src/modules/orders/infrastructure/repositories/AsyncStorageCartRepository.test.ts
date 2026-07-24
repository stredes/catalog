import { describe, expect, it } from 'vitest';
import { normalizeStoredCartItem } from './AsyncStorageCartRepository';

describe('normalizeStoredCartItem', () => {
  it('migra elementos de carrito anteriores a los descuentos', () => {
    const item = normalizeStoredCartItem({
      productId: 'prd_1',
      productName: 'Producto',
      productCode: null,
      unitPrice: 1200,
      quantity: 2,
      format: 'unit',
    });

    expect(item).toEqual({
      productId: 'prd_1',
      productName: 'Producto',
      productCode: undefined,
      unitPrice: 1200,
      quantity: 2,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2400,
    });
  });

  it('recalcula el subtotal en vez de confiar en datos persistidos', () => {
    const item = normalizeStoredCartItem({
      productId: 'prd_1',
      productName: 'Producto',
      unitPrice: 1000,
      quantity: 3,
      format: 'unit',
      discountType: 'percentage',
      discountValue: 10,
      subtotal: 999999,
    });

    expect(item?.subtotal).toBe(2700);
  });

  it('rechaza elementos que no pueden migrarse de forma segura', () => {
    expect(normalizeStoredCartItem({ productId: 'prd_1' })).toBeNull();
  });
});
