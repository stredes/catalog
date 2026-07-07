import { Product } from '../../domain/entities/product';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { UpdateProductDto, updateProductSchema } from '../dtos/product-dto';

export class UpdateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(input: UpdateProductDto): Promise<void> {
    const data = updateProductSchema.parse(input);
    const existing = await this.repository.findById(data.id);
    if (!existing) {
      throw new Error('Producto no encontrado.');
    }

    const updated = new Product(
      existing.id,
      data.name,
      data.price,
      data.format,
      data.photoUri,
      data.familyId,
      existing.createdAt,
      new Date().toISOString(),
    );

    await this.repository.update(updated);
  }
}
