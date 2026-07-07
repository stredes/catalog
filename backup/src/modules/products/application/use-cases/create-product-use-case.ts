import { Product } from '../../domain/entities/product';
import { ProductRepository } from '../../domain/repositories/product-repository';
import { CreateProductDto } from '../dtos/product-dto';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class CreateProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(input: CreateProductDto): Promise<Product> {
    const now = new Date().toISOString();
    const product = new Product(
      generateId(),
      input.name,
      input.price,
      input.format,
      input.photoUri,
      input.familyId,
      now,
      now,
    );

    await this.repository.create(product);
    return product;
  }
}
