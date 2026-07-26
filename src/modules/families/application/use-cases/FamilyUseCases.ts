import { nowIso } from '../../../../shared/utils/dates';
import { createId } from '../../../../shared/utils/ids';
import { Family } from '../../domain/entities/Family';
import { FamilyRepository } from '../../domain/repositories/FamilyRepository';
import { FamilyInputDto, familySchema } from '../dtos/FamilyDtos';
import { familyNotFoundError } from '../../../../shared/errors/AppError';
import { ProductRepository } from '../../../products/domain/repositories/ProductRepository';

export class CreateFamilyUseCase {
  constructor(private readonly repository: FamilyRepository) {}

  async execute(input: FamilyInputDto) {
    const dto = familySchema.parse(input);
    const timestamp = nowIso();
    const family: Family = {
      id: createId('fam'),
      name: dto.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.repository.create(family);
    return family;
  }
}

export class UpdateFamilyUseCase {
  constructor(private readonly repository: FamilyRepository) {}

  async execute(id: string, input: FamilyInputDto) {
    const current = await this.repository.findById(id);

    if (!current) {
      throw familyNotFoundError(id);
    }

    const dto = familySchema.parse(input);
    const updated: Family = { ...current, name: dto.name, updatedAt: nowIso() };
    await this.repository.update(updated);
    return updated;
  }
}

export class DeleteFamilyUseCase {
  constructor(
    private readonly repository: FamilyRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(id: string) {
    const products = await this.productRepository.findByFamily(id);
    if (products.length > 0) {
      throw new Error('No se puede eliminar la familia porque tiene productos asociados');
    }
    return this.repository.delete(id);
  }
}
