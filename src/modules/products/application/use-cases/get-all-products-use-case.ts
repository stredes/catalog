import { ProductRepository } from '../../domain/repositories/product-repository';

export class GetAllProductsUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute() {
    return this.repository.findAll();
  }
}
