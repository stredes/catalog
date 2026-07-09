import { describe, expect, it } from 'vitest';
import {
  FakeImagePickerService,
  InMemoryProductRepository,
  makeProduct,
} from '../../../../__tests__/fakes';
import {
  CreateProductUseCase,
  DeleteProductUseCase,
  GetProductsByFamilyUseCase,
  PickProductImageUseCase,
  UpdateProductUseCase,
} from './ProductUseCases';

describe('Product use cases', () => {
  it('creates a product with image URI and persists it', async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new CreateProductUseCase(repository);

    const product = await useCase.execute({
      name: 'Audifonos',
      price: 49990,
      format: 'unit',
      familyId: 'fam_audio',
      photoUri: 'file:///product-images/audifonos.jpg',
    });

    expect(product.id).toMatch(/^prd_/);
    expect(product.photoUri).toBe('file:///product-images/audifonos.jpg');
    expect(await repository.findById(product.id)).toEqual(product);
  });

  it('rejects invalid product price', async () => {
    const repository = new InMemoryProductRepository();

    await expect(
      new CreateProductUseCase(repository).execute({
        name: 'Audifonos',
        price: 0,
        format: 'unit',
        familyId: 'fam_audio',
      }),
    ).rejects.toThrow();
  });

  it('updates an existing product', async () => {
    const repository = new InMemoryProductRepository();
    const original = makeProduct({ name: 'Viejo', price: 1000 });
    await repository.create(original);

    const updated = await new UpdateProductUseCase(repository).execute(original.id, {
      name: 'Nuevo',
      price: 2500,
      format: 'box',
      familyId: original.familyId,
      photoUri: original.photoUri,
    });

    expect(updated.name).toBe('Nuevo');
    expect(updated.price).toBe(2500);
    expect(updated.format).toBe('box');
    expect(await repository.findById(original.id)).toEqual(updated);
  });

  it('fails when updating a missing product', async () => {
    const repository = new InMemoryProductRepository();

    await expect(
      new UpdateProductUseCase(repository).execute('missing', {
        name: 'Nuevo',
        price: 2500,
        format: 'box',
        familyId: 'fam_1',
      }),
    ).rejects.toThrow('Producto no encontrado');
  });

  it('deletes a product', async () => {
    const repository = new InMemoryProductRepository();
    const product = makeProduct();
    await repository.create(product);

    await new DeleteProductUseCase(repository).execute(product.id);

    expect(await repository.findById(product.id)).toBeNull();
  });

  it('gets products by family', async () => {
    const repository = new InMemoryProductRepository();
    await repository.create(makeProduct({ id: 'prd_1', familyId: 'fam_a' }));
    await repository.create(makeProduct({ id: 'prd_2', familyId: 'fam_b' }));

    const products = await new GetProductsByFamilyUseCase(repository).execute('fam_a');

    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('prd_1');
  });

  it('picks a product image from gallery through the image picker port', async () => {
    const useCase = new PickProductImageUseCase(
      new FakeImagePickerService('file:///product-images/picked.jpg'),
    );

    await expect(useCase.execute('gallery')).resolves.toBe(
      'file:///product-images/picked.jpg',
    );
  });

  it('picks a product image from camera through the image picker port', async () => {
    const useCase = new PickProductImageUseCase(
      new FakeImagePickerService('file:///product-images/picked.jpg'),
    );

    await expect(useCase.execute('camera')).resolves.toBe(
      'file:///product-images/picked.jpg',
    );
  });
});
