import { Product } from '../../domain/entities/product';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { UpdateProductDto } from '../dtos/product-dto';

export class UpdateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(input: UpdateProductDto): Promise<void> {
    const existing = await this.repository.findById(input.id);
    if (!existing) {
      throw new Error('Producto no encontrado.');
    }

    const updated = new Product(
      existing.id,
      input.name,
      input.price,
      input.format,
      input.photoUri,
      input.familyId,
      existing.createdAt,
      new Date().toISOString(),
    );

    await this.repository.update(updated);
  }
}
