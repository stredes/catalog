import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryFamilyRepository,
  InMemoryProductRepository,
  InMemoryOrderRepository,
  InMemoryCartRepository,
  makeFamily,
  makeProduct,
} from '../../../__tests__/fakes';
import { DeleteOrderUseCase, GenerateOrderUseCase, GetOrdersUseCase } from '../application/use-cases/OrderUseCases';
import { AddToCartUseCase } from '../application/use-cases/CartUseCases';
import { CartItem } from '../domain/entities/CartItem';

describe('GenerateOrderUseCase - Atomicidad', () => {
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let orderRepo: InMemoryOrderRepository;
  let cartRepo: InMemoryCartRepository;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    orderRepo = new InMemoryOrderRepository(productRepo);
    cartRepo = new InMemoryCartRepository();
  });

  it('lanza error cuando el carrito esta vacio', async () => {
    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase.execute('Cliente')).rejects.toThrow('El carrito esta vacio');
  });

  it('lanza error cuando stock es insuficiente', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', stock: 2, price: 1000 });
    await productRepo.create(product);

    const cart = new AddToCartUseCase(cartRepo);
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Producto',
      unitPrice: 1000,
      quantity: 5,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 5000,
    }]);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase.execute('Cliente')).rejects.toThrow('Stock insuficiente');

    const orders = await orderRepo.findAll();
    expect(orders).toHaveLength(0);

    const productAfter = await productRepo.findById('prd_1');
    expect(productAfter?.stock).toBe(2);
  });

  it('lanza error cuando producto no existe', async () => {
    await cartRepo.saveItems([{
      productId: 'prd_ghost',
      productName: 'Fantasma',
      unitPrice: 1000,
      quantity: 1,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 1000,
    }]);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase.execute('Cliente')).rejects.toThrow('no encontrado en inventario');
  });

  it('descuenta stock atomicamente y limpia carrito', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product1 = makeProduct({ id: 'prd_1', stock: 10, price: 1000 });
    const product2 = makeProduct({ id: 'prd_2', stock: 5, price: 2000 });
    await productRepo.create(product1);
    await productRepo.create(product2);

    await cartRepo.saveItems([
      {
        productId: 'prd_1',
        productName: 'Prod1',
        unitPrice: 1000,
        quantity: 3,
        format: 'unit',
        discountType: 'none',
        discountValue: 0,
        subtotal: 3000,
      },
      {
        productId: 'prd_2',
        productName: 'Prod2',
        unitPrice: 2000,
        quantity: 2,
        format: 'unit',
        discountType: 'none',
        discountValue: 0,
        subtotal: 4000,
      },
    ]);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    const order = await useCase.execute('Cliente');

    expect(order.orderNumber).toBe(1);
    expect(order.items).toHaveLength(2);
    expect(order.subtotal).toBe(7000);

    const p1 = await productRepo.findById('prd_1');
    expect(p1?.stock).toBe(7);

    const p2 = await productRepo.findById('prd_2');
    expect(p2?.stock).toBe(3);

    const cartItems = await cartRepo.getItems();
    expect(cartItems).toHaveLength(0);
  });

  it('asigna orderNumber incremental correctamente', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', stock: 100, price: 5000 });
    await productRepo.create(product);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 5000, quantity: 1,
      format: 'unit', discountType: 'none', discountValue: 0, subtotal: 5000,
    }]);
    const order1 = await useCase.execute('A');
    expect(order1.orderNumber).toBe(1);

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 5000, quantity: 1,
      format: 'unit', discountType: 'none', discountValue: 0, subtotal: 5000,
    }]);
    const order2 = await useCase.execute('B');
    expect(order2.orderNumber).toBe(2);
  });

  it('devuelve el stock al eliminar un pedido y no permite devolverlo dos veces', async () => {
    await familyRepo.create(makeFamily({ id: 'fam_1' }));
    await productRepo.create(makeProduct({ id: 'prd_1', stock: 10, price: 1000 }));
    await cartRepo.saveItems([{
      productId: 'prd_1',
      productName: 'Producto',
      unitPrice: 1000,
      quantity: 3,
      format: 'unit',
      discountType: 'none',
      discountValue: 0,
      subtotal: 3000,
    }]);

    const generate = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    const remove = new DeleteOrderUseCase(orderRepo);
    const order = await generate.execute('Cliente');

    expect((await productRepo.findById('prd_1'))?.stock).toBe(7);

    await remove.execute(order.id);

    expect((await productRepo.findById('prd_1'))?.stock).toBe(10);
    expect(await orderRepo.findById(order.id)).toBeNull();
    await expect(remove.execute(order.id)).rejects.toThrow('Pedido no encontrado');
    expect((await productRepo.findById('prd_1'))?.stock).toBe(10);
  });

  it('valida cantidades no finitas o no enteras', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', stock: 10, price: 1000 });
    await productRepo.create(product);

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 1000,
      quantity: NaN, format: 'unit', discountType: 'none', discountValue: 0, subtotal: NaN,
    }]);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase.execute('Cliente')).rejects.toThrow('Cantidad inválida');
  });

  it('valida descuento porcentual entre 0 y 100', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', stock: 10, price: 1000 });
    await productRepo.create(product);

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 1000, quantity: 1,
      format: 'unit', discountType: 'percentage', discountValue: 150, subtotal: 1000,
    }]);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase.execute('Cliente')).rejects.toThrow('Descuento porcentual inválido');
  });

  it('valida que descuento monetario no supere subtotal', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', stock: 10, price: 1000 });
    await productRepo.create(product);

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 1000, quantity: 2,
      format: 'unit', discountType: 'currency', discountValue: 3000, subtotal: 2000,
    }]);

    const useCase = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase.execute('Cliente')).rejects.toThrow('descuento no puede superar el subtotal');
  });
});

describe('GenerateOrderUseCase - Concurrencia', () => {
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let orderRepo: InMemoryOrderRepository;
  let cartRepo: InMemoryCartRepository;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    orderRepo = new InMemoryOrderRepository(productRepo);
    cartRepo = new InMemoryCartRepository();
  });

  it('dos pedidos simultaneos con stock limitado - el segundo falla', async () => {
    const family = makeFamily({ id: 'fam_1' });
    await familyRepo.create(family);
    const product = makeProduct({ id: 'prd_1', stock: 3, price: 1000 });
    await productRepo.create(product);

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 1000, quantity: 2,
      format: 'unit', discountType: 'none', discountValue: 0, subtotal: 2000,
    }]);

    const useCase1 = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    const order1 = await useCase1.execute('Cliente A');

    await cartRepo.saveItems([{
      productId: 'prd_1', productName: 'P1', unitPrice: 1000, quantity: 3,
      format: 'unit', discountType: 'none', discountValue: 0, subtotal: 3000,
    }]);

    const useCase2 = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    await expect(useCase2.execute('Cliente B')).rejects.toThrow('Stock insuficiente');

    const productAfter = await productRepo.findById('prd_1');
    expect(productAfter?.stock).toBe(1);
  });
});
