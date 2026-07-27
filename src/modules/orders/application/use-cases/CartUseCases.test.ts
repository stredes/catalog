import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryCartRepository, InMemoryProductRepository, InMemoryFamilyRepository, makeProduct, makeFamily } from '../../../../__tests__/fakes';
import { AddToCartUseCase } from './AddToCartUseCase';
import { UpdateCartItemUseCase } from './UpdateCartItemUseCase';
import { RemoveFromCartUseCase } from './RemoveFromCartUseCase';
import { ClearCartUseCase } from './ClearCartUseCase';
import { GetCartItemsUseCase } from './GetCartItemsUseCase';
import { CartItem } from '../../domain/entities/CartItem';

describe('AddToCartUseCase', () => {
  let cartRepo: InMemoryCartRepository;
  let productRepo: InMemoryProductRepository;
  let familyRepo: InMemoryFamilyRepository;

  beforeEach(() => {
    cartRepo = new InMemoryCartRepository();
    productRepo = new InMemoryProductRepository();
    familyRepo = new InMemoryFamilyRepository();
  });

  const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    productId: 'prd_1',
    productName: 'Producto Test',
    productCode: undefined,
    unitPrice: 1000,
    quantity: 2,
    format: 'unit',
    discountType: 'none',
    discountValue: 0,
    subtotal: 2000,
    ...overrides,
  });

  it('adds a product to empty cart', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', name: 'Producto Test', price: 1000, stock: 10 });
    await productRepo.create(product);

    const useCase = new AddToCartUseCase(cartRepo);
    const items = await useCase.execute(makeItem());

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prd_1');
    expect(items[0].quantity).toBe(2);
    expect(items[0].unitPrice).toBe(1000);
    expect(items[0].subtotal).toBe(2000);
  });

  it('increments quantity if product already in cart', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', name: 'Producto Test', price: 1000, stock: 10 });
    await productRepo.create(product);

    const useCase = new AddToCartUseCase(cartRepo);

    await useCase.execute(makeItem({ quantity: 1 }));
    const items = await useCase.execute(makeItem({ quantity: 2 }));

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('adds multiple different products', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product1 = makeProduct({ id: 'prd_1', name: 'Prod 1', price: 1000, stock: 10 });
    const product2 = makeProduct({ id: 'prd_2', name: 'Prod 2', price: 2000, stock: 5 });
    await productRepo.create(product1);
    await productRepo.create(product2);

    const useCase = new AddToCartUseCase(cartRepo);

    await useCase.execute(makeItem({ productId: 'prd_1', productName: 'Prod 1', quantity: 1 }));
    const items = await useCase.execute(makeItem({ productId: 'prd_2', productName: 'Prod 2', quantity: 2 }));

    expect(items).toHaveLength(2);
    expect(items.find(i => i.productId === 'prd_1')?.quantity).toBe(1);
    expect(items.find(i => i.productId === 'prd_2')?.quantity).toBe(2);
  });
});

describe('UpdateCartItemUseCase', () => {
  let cartRepo: InMemoryCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryCartRepository();
  });

  const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    productId: 'prd_1',
    productName: 'Test',
    productCode: undefined,
    unitPrice: 1000,
    quantity: 1,
    format: 'unit',
    discountType: 'none',
    discountValue: 0,
    subtotal: 1000,
    ...overrides,
  });

  it('updates item quantity', async () => {
    await cartRepo.saveItems([makeItem()]);

    const useCase = new UpdateCartItemUseCase(cartRepo);
    const items = await useCase.execute('prd_1', 5);

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
    expect(items[0].subtotal).toBe(5000);
  });

  it('removes item when quantity <= 0', async () => {
    await cartRepo.saveItems([makeItem()]);

    const useCase = new UpdateCartItemUseCase(cartRepo);
    const items = await useCase.execute('prd_1', 0);

    expect(items).toHaveLength(0);
  });

  it('returns empty when item not in cart', async () => {
    const useCase = new UpdateCartItemUseCase(cartRepo);
    const items = await useCase.execute('missing', 5);

    expect(items).toHaveLength(0);
  });
});

describe('RemoveFromCartUseCase', () => {
  let cartRepo: InMemoryCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryCartRepository();
  });

  const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    productId: 'prd_1',
    productName: 'Test',
    productCode: undefined,
    unitPrice: 1000,
    quantity: 1,
    format: 'unit',
    discountType: 'none',
    discountValue: 0,
    subtotal: 1000,
    ...overrides,
  });

  it('removes item from cart', async () => {
    await cartRepo.saveItems([makeItem({ productId: 'prd_1' }), makeItem({ productId: 'prd_2', productName: 'Other' })]);

    const useCase = new RemoveFromCartUseCase(cartRepo);
    const items = await useCase.execute('prd_1');

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prd_2');
  });

  it('returns unchanged cart when item not present', async () => {
    await cartRepo.saveItems([makeItem()]);

    const useCase = new RemoveFromCartUseCase(cartRepo);
    const items = await useCase.execute('missing');

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prd_1');
  });
});

describe('ClearCartUseCase', () => {
  let cartRepo: InMemoryCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryCartRepository();
  });

  const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    productId: 'prd_1',
    productName: 'Test',
    productCode: undefined,
    unitPrice: 1000,
    quantity: 1,
    format: 'unit',
    discountType: 'none',
    discountValue: 0,
    subtotal: 1000,
    ...overrides,
  });

  it('clears all items', async () => {
    await cartRepo.saveItems([makeItem({ productId: 'prd_1' }), makeItem({ productId: 'prd_2', productName: 'Other' })]);

    const useCase = new ClearCartUseCase(cartRepo);
    await useCase.execute();

    const items = await cartRepo.getItems();
    expect(items).toHaveLength(0);
  });

  it('works on already empty cart', async () => {
    const useCase = new ClearCartUseCase(cartRepo);
    await useCase.execute();

    const items = await cartRepo.getItems();
    expect(items).toHaveLength(0);
  });
});

describe('GetCartItemsUseCase', () => {
  let cartRepo: InMemoryCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryCartRepository();
  });

  const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
    productId: 'prd_1',
    productName: 'Test',
    productCode: undefined,
    unitPrice: 1000,
    quantity: 1,
    format: 'unit',
    discountType: 'none',
    discountValue: 0,
    subtotal: 1000,
    ...overrides,
  });

  it('returns all items', async () => {
    await cartRepo.saveItems([makeItem({ productId: 'prd_1' }), makeItem({ productId: 'prd_2', productName: 'Other' })]);

    const useCase = new GetCartItemsUseCase(cartRepo);
    const items = await useCase.execute();

    expect(items).toHaveLength(2);
  });

  it('returns empty array for empty cart', async () => {
    const useCase = new GetCartItemsUseCase(cartRepo);
    const items = await useCase.execute();

    expect(items).toHaveLength(0);
  });
});