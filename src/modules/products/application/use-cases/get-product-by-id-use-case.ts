import { ProductRepository } from '../../domain/repositories/product-repository';

export class GetProductByIdUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(id: string) {
    return this.repository.findById(id);
  }
}
