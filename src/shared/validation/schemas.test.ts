import { describe, it, expect } from 'vitest';
import {
  validateBackupPayload,
  validateArray,
  ProductSchema,
  OrderSchema,
  CartItemSchema,
  FamilySchema,
  ProfileSchema,
  SupplierSchema,
  MoneySchema,
  PercentageSchema,
  NonNegativeInteger,
  StrictPositiveInteger,
  ValidationErrorReport,
} from '../validation/schemas';

describe('Shared Validation Schemas', () => {
  describe('MoneySchema', () => {
    it('acepta numeros finitos no negativos', () => {
      expect(MoneySchema.safeParse(0).success).toBe(true);
      expect(MoneySchema.safeParse(1000).success).toBe(true);
      expect(MoneySchema.safeParse(1000.50).success).toBe(true);
    });

    it('rechaza numeros negativos', () => {
      expect(MoneySchema.safeParse(-1).success).toBe(false);
    });

    it('rechaza NaN e Infinity', () => {
      expect(MoneySchema.safeParse(NaN).success).toBe(false);
      expect(MoneySchema.safeParse(Infinity).success).toBe(false);
      expect(MoneySchema.safeParse(-Infinity).success).toBe(false);
    });
  });

  describe('PercentageSchema', () => {
    it('acepta valores entre 0 y 100', () => {
      expect(PercentageSchema.safeParse(0).success).toBe(true);
      expect(PercentageSchema.safeParse(50).success).toBe(true);
      expect(PercentageSchema.safeParse(100).success).toBe(true);
    });

    it('rechaza valores fuera de rango', () => {
      expect(PercentageSchema.safeParse(-1).success).toBe(false);
      expect(PercentageSchema.safeParse(101).success).toBe(false);
    });
  });

  describe('NonNegativeInteger', () => {
    it('acepta enteros no negativos', () => {
      expect(NonNegativeInteger.safeParse(0).success).toBe(true);
      expect(NonNegativeInteger.safeParse(5).success).toBe(true);
    });

    it('rechaza negativos y decimales', () => {
      expect(NonNegativeInteger.safeParse(-1).success).toBe(false);
      expect(NonNegativeInteger.safeParse(1.5).success).toBe(false);
    });
  });

  describe('StrictPositiveInteger', () => {
    it('acepta enteros positivos', () => {
      expect(StrictPositiveInteger.safeParse(1).success).toBe(true);
      expect(StrictPositiveInteger.safeParse(100).success).toBe(true);
    });

    it('rechaza cero y negativos', () => {
      expect(StrictPositiveInteger.safeParse(0).success).toBe(false);
      expect(StrictPositiveInteger.safeParse(-1).success).toBe(false);
    });
  });

  describe('FamilySchema', () => {
    it('valida familia correcta', () => {
      expect(FamilySchema.safeParse({
        id: 'fam_1', name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(true);
    });

    it('rechaza familia sin id', () => {
      expect(FamilySchema.safeParse({
        id: '', name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(false);
    });
  });

  describe('ProductSchema', () => {
    it('valida producto correcto', () => {
      expect(ProductSchema.safeParse({
        id: 'prd_1', name: 'Test', price: 1000, stock: 5,
        format: 'unit', familyId: 'fam_1',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(true);
    });

    it('rechaza precio negativo', () => {
      expect(ProductSchema.safeParse({
        id: 'prd_1', name: 'Test', price: -100, stock: 5,
        format: 'unit', familyId: 'fam_1',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(false);
    });

    it('rechaza stock negativo', () => {
      expect(ProductSchema.safeParse({
        id: 'prd_1', name: 'Test', price: 1000, stock: -1,
        format: 'unit', familyId: 'fam_1',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(false);
    });

    it('rechaza stock NaN', () => {
      expect(ProductSchema.safeParse({
        id: 'prd_1', name: 'Test', price: 1000, stock: NaN,
        format: 'unit', familyId: 'fam_1',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(false);
    });

    it('rechaza format invalido', () => {
      expect(ProductSchema.safeParse({
        id: 'prd_1', name: 'Test', price: 1000, stock: 5,
        format: 'invalid', familyId: 'fam_1',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(false);
    });
  });

  describe('OrderSchema', () => {
    it('valida pedido correcto', () => {
      expect(OrderSchema.safeParse({
        id: 'ord_1', orderNumber: 1, clientName: 'Cliente',
        items: [], subtotal: 0, iva: 0, total: 0,
        status: 'pending', paidAmount: 0, createdAt: '2026-01-01',
      }).success).toBe(true);
    });

    it('rechaza status invalido', () => {
      expect(OrderSchema.safeParse({
        id: 'ord_1', orderNumber: 1, clientName: 'Cliente',
        items: [], subtotal: 0, iva: 0, total: 0,
        status: 'invalid', paidAmount: 0, createdAt: '2026-01-01',
      }).success).toBe(false);
    });
  });

  describe('CartItemSchema', () => {
    it('valida item correcto', () => {
      expect(CartItemSchema.safeParse({
        productId: 'prd_1', productName: 'Test',
        unitPrice: 1000, quantity: 2, format: 'unit',
        discountType: 'none', discountValue: 0, subtotal: 2000,
      }).success).toBe(true);
    });

    it('rechaza cantidad no entera', () => {
      expect(CartItemSchema.safeParse({
        productId: 'prd_1', productName: 'Test',
        unitPrice: 1000, quantity: 1.5, format: 'unit',
        discountType: 'none', discountValue: 0, subtotal: 1500,
      }).success).toBe(false);
    });

    it('rechaza precio no finito', () => {
      expect(CartItemSchema.safeParse({
        productId: 'prd_1', productName: 'Test',
        unitPrice: Infinity, quantity: 1, format: 'unit',
        discountType: 'none', discountValue: 0, subtotal: Infinity,
      }).success).toBe(false);
    });
  });

  describe('SupplierSchema', () => {
    it('valida proveedor correcto', () => {
      expect(SupplierSchema.safeParse({
        id: 'sup_1', name: 'Proveedor',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(true);
    });

    it('rechaza nombre vacio', () => {
      expect(SupplierSchema.safeParse({
        id: 'sup_1', name: '',
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      }).success).toBe(false);
    });
  });

  describe('ProfileSchema', () => {
    it('valida perfil correcto', () => {
      expect(ProfileSchema.safeParse({
        id: 'profile', businessName: 'Mi Empresa',
        updatedAt: '2026-01-01',
      }).success).toBe(true);
    });

    it('rechaza id que no es "profile"', () => {
      expect(ProfileSchema.safeParse({
        id: 'not_profile', businessName: 'Mi Empresa',
        updatedAt: '2026-01-01',
      }).success).toBe(false);
    });
  });
});

describe('validateBackupPayload', () => {
  it('payload valido retorna success', () => {
    const result = validateBackupPayload({
      schemaVersion: 14,
      createdAt: '2026-01-01T00:00:00.000Z',
      families: [],
      products: [],
      catalogs: [],
      profile: null,
      orders: [],
      suppliers: [],
      images: {},
    });
    expect(result.success).toBe(true);
  });

  it('payload invalido retorna errores tipados', () => {
    const result = validateBackupPayload({
      schemaVersion: 'not a number',
      createdAt: '',
      families: 'not an array',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('path');
      expect(result.errors[0]).toHaveProperty('message');
    }
  });

  it('payload con datos corruptos retorna errores', () => {
    const result = validateBackupPayload({
      schemaVersion: 14,
      createdAt: '2026-01-01',
      families: [{ id: '', name: '' }],
      products: [{ id: 'p', name: 'P', price: -1, stock: -1, format: 'bad', familyId: '', createdAt: '', updatedAt: '' }],
      catalogs: [],
      profile: null,
      orders: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });
});

describe('validateArray', () => {
  it('filtra registros validos y reporta fallidos', () => {
    const data = [
      { id: '1', name: 'Valid', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: '', name: '' },
      { id: '2', name: 'Also Valid', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];

    const schema = FamilySchema;
    const { valid, failures } = validateArray(data, schema, 'familia');

    expect(valid).toHaveLength(2);
    expect(failures).toHaveLength(1);
    expect(failures[0].index).toBe(1);
  });

  it('retorna vacio cuando todos fallan', () => {
    const data = [
      { id: '', name: '' },
      { id: '', name: '' },
    ];

    const { valid, failures } = validateArray(data, FamilySchema, 'familia');
    expect(valid).toHaveLength(0);
    expect(failures).toHaveLength(2);
  });
});

describe('ValidationErrorReport', () => {
  it('crea error con resumen correcto', () => {
    const errors = [
      { path: 'families[0].name', message: 'Requerido' },
      { path: 'products[0].price', message: 'Invalido' },
    ];
    const report = new ValidationErrorReport('backup', errors);

    expect(report.name).toBe('ValidationErrorReport');
    expect(report.entityName).toBe('backup');
    expect(report.errors).toHaveLength(2);
    expect(report.message).toContain('backup');
  });

  it('trunca resumen a 5 errores', () => {
    const errors = Array.from({ length: 10 }, (_, i) => ({
      path: `[${i}]`,
      message: `Error ${i}`,
    }));
    const report = new ValidationErrorReport('backup', errors);
    expect(report.message).toContain('+5 más');
  });
});
