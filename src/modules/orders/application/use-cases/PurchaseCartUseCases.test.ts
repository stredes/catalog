import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryPurchaseCartRepository } from '../../../../__tests__/fakes';
import {
  AddToPurchaseCartUseCase,
  UpdatePurchaseCartItemUseCase,
  UpdatePurchaseCartItemDiscountUseCase,
  RemoveFromPurchaseCartUseCase,
  ClearPurchaseCartUseCase,
  GetPurchaseCartItemsUseCase,
} from './PurchaseCartUseCases';
import { PurchaseCartItem } from '../../domain/entities/PurchaseCartItem';

describe('AddToPurchaseCartUseCase', () => {
  let cartRepo: InMemoryPurchaseCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryPurchaseCartRepository();
  });

  it('adds item to empty cart', async () => {
    const useCase = new AddToPurchaseCartUseCase(cartRepo);
    const item: PurchaseCartItem = {
      productId: 'prd_1',
      productName: 'Test Product',
      unitPrice: 1000,
      quantity: 2,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2000,
    };

    const result = await useCase.execute(item);

    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('prd_1');
    expect(result[0].quantity).toBe(2);
  });

  it('increments quantity when product already exists', async () => {
    const useCase = new AddToPurchaseCartUseCase(cartRepo);
    const item: PurchaseCartItem = {
      productId: 'prd_1',
      productName: 'Test Product',
      unitPrice: 1000,
      quantity: 1,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 1000,
    };

    await useCase.execute(item);
    const result = await useCase.execute({ ...item, quantity: 3 });

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(4);
    expect(result[0].subtotal).toBe(4000);
  });

  it('keeps separate items for different products', async () => {
    const useCase = new AddToPurchaseCartUseCase(cartRepo);

    await useCase.execute({
      productId: 'prd_1',
      productName: 'Product 1',
      unitPrice: 1000,
      quantity: 2,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2000,
    });

    await useCase.execute({
      productId: 'prd_2',
      productName: 'Product 2',
      unitPrice: 2000,
      quantity: 1,
      format: 'box',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2000,
    });

    const items = await cartRepo.getItems();
    expect(items).toHaveLength(2);
  });
});

describe('UpdatePurchaseCartItemUseCase', () => {
  let cartRepo: InMemoryPurchaseCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryPurchaseCartRepository();
  });

  it('updates quantity', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 1,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 1000,
    }]);

    const useCase = new UpdatePurchaseCartItemUseCase(cartRepo);
    const result = await useCase.execute('prd_1', 5);

    expect(result[0].quantity).toBe(5);
    expect(result[0].subtotal).toBe(5000);
  });

  it('removes item when quantity <= 0', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 2,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2000,
    }]);

    const useCase = new UpdatePurchaseCartItemUseCase(cartRepo);
    const result = await useCase.execute('prd_1', 0);

    expect(result).toHaveLength(0);
  });

  it('returns empty when item not found', async () => {
    const useCase = new UpdatePurchaseCartItemUseCase(cartRepo);
    const result = await useCase.execute('missing', 5);

    expect(result).toHaveLength(0);
  });
});

describe('UpdatePurchaseCartItemDiscountUseCase', () => {
  let cartRepo: InMemoryPurchaseCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryPurchaseCartRepository();
  });

  it('applies percentage discount', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 2,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2000,
    }]);

    const useCase = new UpdatePurchaseCartItemDiscountUseCase(cartRepo);
    const result = await useCase.execute('prd_1', 'percentage', 10);

    expect(result[0].discountType).toBe('percentage');
    expect(result[0].discountValue).toBe(10);
    expect(result[0].subtotal).toBe(1800);
  });

  it('applies currency discount', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 2,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 2000,
    }]);

    const useCase = new UpdatePurchaseCartItemDiscountUseCase(cartRepo);
    const result = await useCase.execute('prd_1', 'currency', 300);

    expect(result[0].discountType).toBe('currency');
    expect(result[0].discountValue).toBe(300);
    expect(result[0].subtotal).toBe(1700);
  });

  it('removes discount when type is none', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 2,
      format: 'unit',
      discountType: 'percentage',
      discountValue: 10,
      subtotal: 1800,
    }]);

    const useCase = new UpdatePurchaseCartItemDiscountUseCase(cartRepo);
    const result = await useCase.execute('prd_1', 'none', 0);

    expect(result[0].discountType).toBe('none');
    expect(result[0].discountValue).toBe(0);
    expect(result[0].subtotal).toBe(2000);
  });

  it('does nothing when item not found', async () => {
    const useCase = new UpdatePurchaseCartItemDiscountUseCase(cartRepo);
    const result = await useCase.execute('missing', 'percentage', 10);

    expect(result).toHaveLength(0);
  });
});

describe('RemoveFromPurchaseCartUseCase', () => {
  let cartRepo: InMemoryPurchaseCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryPurchaseCartRepository();
  });

  it('removes specific item', async () => {
    await cartRepo.saveItems([
      { productId: 'prd_1', productName: 'Test1', unitPrice: 1000, quantity: 1, format: 'unit', discountType: 'none', discountValue: 0, subtotal: 1000 },
      { productId: 'prd_2', productName: 'Test2', unitPrice: 2000, quantity: 1, format: 'unit', discountType: 'none', discountValue: 0, subtotal: 2000 },
    ]);

    const useCase = new RemoveFromPurchaseCartUseCase(cartRepo);
    const result = await useCase.execute('prd_1');

    expect(result).toHaveLength(1);
    expect(result[0].productId).toBe('prd_2');
  });

  it('does nothing when item not found', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 1,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 1000,
    }]);

    const useCase = new RemoveFromPurchaseCartUseCase(cartRepo);
    const result = await useCase.execute('missing');

    expect(result).toHaveLength(1);
  });
});

describe('ClearPurchaseCartUseCase', () => {
  let cartRepo: InMemoryPurchaseCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryPurchaseCartRepository();
  });

  it('clears all items', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Test',
      unitPrice: 1000,
      quantity: 1,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 1000,
    }]);

    const useCase = new ClearPurchaseCartUseCase(cartRepo);
    await useCase.execute();

    const items = await cartRepo.getItems();
    expect(items).toHaveLength(0);
  });

  it('works on empty cart', async () => {
    const useCase = new ClearPurchaseCartUseCase(cartRepo);
    await useCase.execute();

    const items = await cartRepo.getItems();
    expect(items).toHaveLength(0);
  });
});

describe('GetPurchaseCartItemsUseCase', () => {
  let cartRepo: InMemoryPurchaseCartRepository;

  beforeEach(() => {
    cartRepo = new InMemoryPurchaseCartRepository();
  });

  it('returns all items', async () => {
    await cartRepo.saveItems([
      { productId: 'prd_1', productName: 'Test1', unitPrice: 1000, quantity: 2, format: 'unit', discountType: 'none', discountValue: 0, subtotal: 2000 },
      { productId: 'prd_2', productName: 'Test2', unitPrice: 2000, quantity: 1, format: 'box', discountType: 'none', discountValue: 0, subtotal: 2000 },
    ]);

    const useCase = new GetPurchaseCartItemsUseCase(cartRepo);
    const items = await useCase.execute();

    expect(items).toHaveLength(2);
  });

  it('returns empty array for empty cart', async () => {
    const useCase = new GetPurchaseCartItemsUseCase(cartRepo);
    const items = await useCase.execute();

    expect(items).toEqual([]);
  });
});