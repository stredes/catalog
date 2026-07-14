import { createId } from '../../../../shared/utils/ids';
import { nowIso } from '../../../../shared/utils/dates';
import { Product } from '../../domain/entities/Product';
import { ImagePickerService, ImageSource } from '../../domain/repositories/ImagePickerService';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ProductInputDto, productSchema } from '../dtos/ProductDtos';

export class CreateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(input: ProductInputDto) {
    const dto = productSchema.parse(input);
    const timestamp = nowIso();
    const product: Product = {
      id: createId('prd'),
      ...dto,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.repository.create(product);
    return product;
  }
}

export class UpdateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string, input: ProductInputDto) {
    const current = await this.repository.findById(id);

    if (!current) {
      throw new Error('Producto no encontrado');
    }

    const dto = productSchema.parse(input);
    const updated: Product = {
      ...current,
      ...dto,
      updatedAt: nowIso(),
    };

    await this.repository.update(updated);
    return updated;
  }
}

export class DeleteProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute(id: string) {
    return this.repository.delete(id);
  }
}

export class GetProductsByFamilyUseCase {
  constructor(private readonly repository: ProductRepository) {}

  execute(familyId: string) {
    return this.repository.findByFamily(familyId);
  }
}

export class UpdateStockUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string, stock: number) {
    if (stock < 0) {
      throw new Error('El stock no puede ser negativo');
    }
    await this.repository.updateStock(id, stock);
  }
}

export class PickProductImageUseCase {
  constructor(private readonly imagePicker: ImagePickerService) {}

  execute(source: ImageSource) {
    return this.imagePicker.pickImage(source);
  }
}
