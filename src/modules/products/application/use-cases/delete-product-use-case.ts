import { ProductRepository } from '../../domain/repositories/product-repository';

export class DeleteProductUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
