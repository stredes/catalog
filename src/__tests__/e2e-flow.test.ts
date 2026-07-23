import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryFamilyRepository,
  InMemoryProductRepository,
  InMemoryCatalogRepository,
  InMemoryProfileRepository,
  InMemoryOrderRepository,
  InMemoryCartRepository,
  FakePdfGenerator,
  FakeShareService,
  FakeOrderPdfGenerator,
  makeProfile,
} from './fakes';
import { CreateProductUseCase } from '../modules/products/application/use-cases/ProductUseCases';
import { CreateFamilyUseCase } from '../modules/families/application/use-cases/FamilyUseCases';
import { GenerateCatalogPdfUseCase, ShareCatalogPdfUseCase } from '../modules/catalogs/application/use-cases/CatalogUseCases';
import { AddToCartUseCase, UpdateCartItemUseCase, ClearCartUseCase } from '../modules/orders/application/use-cases/CartUseCases';
import {
  GenerateOrderUseCase,
  GetOrdersUseCase,
  DeleteOrderUseCase,
  RecordPaymentUseCase,
  formatOrderAsText,
} from '../modules/orders/application/use-cases/OrderUseCases';
import { GenerateOrderPdfUseCase } from '../modules/orders/application/use-cases/GenerateOrderPdfUseCase';

describe('E2E: Flujo completo producto → carrito → orden → PDF', () => {
  let familyRepo: InMemoryFamilyRepository;
  let productRepo: InMemoryProductRepository;
  let catalogRepo: InMemoryCatalogRepository;
  let profileRepo: InMemoryProfileRepository;
  let orderRepo: InMemoryOrderRepository;
  let cartRepo: InMemoryCartRepository;
  let pdfGenerator: FakePdfGenerator;
  let orderPdfGenerator: FakeOrderPdfGenerator;
  let shareService: FakeShareService;

  beforeEach(() => {
    familyRepo = new InMemoryFamilyRepository();
    productRepo = new InMemoryProductRepository();
    catalogRepo = new InMemoryCatalogRepository();
    profileRepo = new InMemoryProfileRepository();
    orderRepo = new InMemoryOrderRepository();
    cartRepo = new InMemoryCartRepository();
    pdfGenerator = new FakePdfGenerator();
    orderPdfGenerator = new FakeOrderPdfGenerator();
    shareService = new FakeShareService();
  });

  it('flujo completo: crear familia → producto → carrito → orden → PDF → compartir', async () => {
    const profile = makeProfile({ businessName: 'Mi Tienda', ownerName: 'Juan Perez' });
    await profileRepo.save(profile);
    const savedProfile = await profileRepo.find();
    expect(savedProfile?.businessName).toBe('Mi Tienda');

    const createFamily = new CreateFamilyUseCase(familyRepo);
    const family = await createFamily.execute({ name: 'Electrónica' });
    expect(family.id).toMatch(/^fam_/);
    expect(family.name).toBe('Electrónica');

    const createProduct = new CreateProductUseCase(productRepo);
    const product1 = await createProduct.execute({
      name: 'Audífono Bluetooth',
      price: 25000,
      stock: 15,
      format: 'unit',
      familyId: family.id,
    });
    expect(product1.id).toMatch(/^prd_/);

    const product2 = await createProduct.execute({
      name: 'Cable USB-C',
      price: 5000,
      stock: 50,
      format: 'unit',
      familyId: family.id,
    });

    const generateCatalogPdf = new GenerateCatalogPdfUseCase(
      catalogRepo, familyRepo, productRepo, pdfGenerator, profileRepo,
    );
    const catalog = await generateCatalogPdf.execute({
      name: 'Catálogo Electrónica',
      familyId: family.id,
      format: 'grid-2',
      productIds: [product1.id, product2.id],
    });
    expect(catalog.id).toMatch(/^cat_/);
    expect(catalog.pdfUri).toBeTruthy();
    expect(catalog.productIds).toHaveLength(2);

    expect(pdfGenerator.calls).toHaveLength(1);
    expect(pdfGenerator.calls[0].products.map((p) => p.id).sort()).toEqual(
      [product1.id, product2.id].sort(),
    );
    expect(pdfGenerator.calls[0].profile?.businessName).toBe('Mi Tienda');

    const shareCatalog = new ShareCatalogPdfUseCase(shareService);
    await shareCatalog.execute(catalog);
    expect(shareService.calls).toHaveLength(1);
    expect(shareService.calls[0].uri).toBe(catalog.pdfUri);

    const addToCart = new AddToCartUseCase(cartRepo);
    const cartAfterFirst = await addToCart.execute({
      productId: product1.id,
      productName: product1.name,
      productCode: product1.code,
      unitPrice: product1.price,
      quantity: 3,
      format: product1.format,
      discountType: 'none',
      discountValue: 0,
      subtotal: 3 * product1.price,
    });
    expect(cartAfterFirst).toHaveLength(1);
    expect(cartAfterFirst[0].quantity).toBe(3);
    expect(cartAfterFirst[0].subtotal).toBe(75000);

    const cartAfterSecond = await addToCart.execute({
      productId: product2.id,
      productName: product2.name,
      productCode: product2.code,
      unitPrice: product2.price,
      quantity: 10,
      format: product2.format,
      discountType: 'none',
      discountValue: 0,
      subtotal: 10 * product2.price,
    });
    expect(cartAfterSecond).toHaveLength(2);

    const cartAfterDuplicate = await addToCart.execute({
      productId: product1.id,
      productName: product1.name,
      productCode: product1.code,
      unitPrice: product1.price,
      quantity: 2,
      format: product1.format,
      discountType: 'none',
      discountValue: 0,
      subtotal: 2 * product1.price,
    });
    expect(cartAfterDuplicate).toHaveLength(2);
    expect(cartAfterDuplicate.find((i) => i.productId === product1.id)?.quantity).toBe(5);

    const updateCart = new UpdateCartItemUseCase(cartRepo);
    const cartAfterUpdate = await updateCart.execute(product2.id, 7);
    expect(cartAfterUpdate.find((i) => i.productId === product2.id)?.quantity).toBe(7);
    expect(cartAfterUpdate.find((i) => i.productId === product2.id)?.subtotal).toBe(35000);

    const allCartItems = await cartRepo.getItems();
    expect(allCartItems).toHaveLength(2);
    const totalCartValue = allCartItems.reduce((sum, i) => sum + i.subtotal, 0);
    expect(totalCartValue).toBe(5 * 25000 + 7 * 5000);

    const generateOrder = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    const order = await generateOrder.execute('Cliente Importante', 'Entregar antes del viernes');
    expect(order.id).toMatch(/^order_/);
    expect(order.clientName).toBe('Cliente Importante');
    expect(order.items).toHaveLength(2);
    expect(order.subtotal).toBe(160000);
    expect(order.iva).toBe(0);
    expect(order.total).toBe(160000);
    expect(order.notes).toBe('Entregar antes del viernes');

    const emptyCart = await cartRepo.getItems();
    expect(emptyCart).toHaveLength(0);

    const savedOrder = await orderRepo.findById(order.id);
    expect(savedOrder).not.toBeNull();
    expect(savedOrder?.clientName).toBe('Cliente Importante');

    const text = formatOrderAsText(order, savedProfile);
    expect(text).toContain('MI TIENDA');
    expect(text).toContain('Cliente Importante');
    expect(text).toContain('Audífono Bluetooth');
    expect(text).toContain('Cable USB-C');

    const generateOrderPdf = new GenerateOrderPdfUseCase(orderPdfGenerator);
    const pdfUri = await generateOrderPdf.execute(order, savedProfile);
    expect(pdfUri).toBeTruthy();
    expect(orderPdfGenerator.lastCall).not.toBeNull();
    expect(orderPdfGenerator.lastCall?.order.clientName).toBe('Cliente Importante');
    expect(orderPdfGenerator.lastCall?.profile?.businessName).toBe('Mi Tienda');

    const getOrders = new GetOrdersUseCase(orderRepo);
    const allOrders = await getOrders.execute();
    expect(allOrders).toHaveLength(1);
    expect(allOrders[0].id).toBe(order.id);

    const clearCart = new ClearCartUseCase(cartRepo);
    await clearCart.execute();
    const cartAfterClear = await cartRepo.getItems();
    expect(cartAfterClear).toHaveLength(0);
  });

  it('flujo de catálogo con propósito de detalle de compra', async () => {
    const createFamily = new CreateFamilyUseCase(familyRepo);
    const family = await createFamily.execute({ name: 'Repuestos' });

    const createProduct = new CreateProductUseCase(productRepo);
    const product = await createProduct.execute({
      name: 'Filtro de aceite',
      price: 3000,
      stock: 100,
      format: 'unit',
      familyId: family.id,
    });

    const generateCatalogPdf = new GenerateCatalogPdfUseCase(
      catalogRepo, familyRepo, productRepo, pdfGenerator, profileRepo,
    );

    const catalog = await generateCatalogPdf.execute({
      name: 'Pedido Proveedor AutoParts',
      familyId: family.id,
      format: 'simple-list',
      purpose: 'purchase-detail',
      productIds: [product.id],
    });

    expect(catalog.purpose).toBe('purchase-detail');
    expect(catalog.name).toBe('Pedido Proveedor AutoParts');

    const input = pdfGenerator.calls[0];
    expect(input.purpose).toBe('purchase-detail');
    expect(input.catalogName).toBe('Pedido Proveedor AutoParts');
  });

  it('flujo de múltiples carritos y órdenes', async () => {
    const createFamily = new CreateFamilyUseCase(familyRepo);
    const family = await createFamily.execute({ name: 'Ropa' });

    const createProduct = new CreateProductUseCase(productRepo);
    const shirt = await createProduct.execute({
      name: 'Polera Básica',
      price: 8000,
      stock: 30,
      format: 'unit',
      familyId: family.id,
    });
    const pants = await createProduct.execute({
      name: 'Pantalón Jean',
      price: 25000,
      stock: 15,
      format: 'unit',
      familyId: family.id,
    });

    const addToCart = new AddToCartUseCase(cartRepo);

    await addToCart.execute({
      productId: shirt.id,
      productName: shirt.name,
      unitPrice: shirt.price,
      quantity: 5,
      format: shirt.format,
      discountType: 'none',
      discountValue: 0,
      subtotal: 5 * shirt.price,
    });

    const generateOrder = new GenerateOrderUseCase(orderRepo, cartRepo, productRepo);
    const order1 = await generateOrder.execute('Cliente A');
    expect(order1.subtotal).toBe(40000);

    await addToCart.execute({
      productId: pants.id,
      productName: pants.name,
      unitPrice: pants.price,
      quantity: 2,
      format: pants.format,
      discountType: 'none',
      discountValue: 0,
      subtotal: 2 * pants.price,
    });

    const order2 = await generateOrder.execute('Cliente B');
    expect(order2.subtotal).toBe(50000);

    const getOrders = new GetOrdersUseCase(orderRepo);
    const allOrders = await getOrders.execute();
    expect(allOrders).toHaveLength(2);

    const deleteOrder = new DeleteOrderUseCase(orderRepo);
    await deleteOrder.execute(order1.id);

    const remainingOrders = await getOrders.execute();
    expect(remainingOrders).toHaveLength(1);
    expect(remainingOrders[0].clientName).toBe('Cliente B');
  });
});

describe('Pagos parciales', () => {
  it('acumula abonos y marca el pedido como pagado al completar el saldo', async () => {
    const repository = new InMemoryOrderRepository();
    await repository.save({
      id: 'order_partial',
      orderNumber: 1,
      clientName: 'Cliente',
      items: [],
      subtotal: 10000,
      iva: 0,
      total: 10000,
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    });

    const recordPayment = new RecordPaymentUseCase(repository);
    const partial = await recordPayment.execute('order_partial', 4000);
    expect(partial.status).toBe('partial');
    expect(partial.paidAmount).toBe(4000);

    const paid = await recordPayment.execute('order_partial', 6000);
    expect(paid.status).toBe('paid');
    expect(paid.paidAmount).toBe(10000);

    await expect(recordPayment.execute('order_partial', 1)).rejects.toThrow('ya esta pagado');
  });
});
