import { ProductRepository } from '../../domain/repositories/product-repository';

export class GetProductsByFamilyUseCase {
  constructor(private readonly repository: ProductRepository) {}

  async execute(familyId: string) {
    return this.repository.findByFamilyId(familyId);
  }
}
