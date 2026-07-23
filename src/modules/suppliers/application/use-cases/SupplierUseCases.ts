import { nowIso } from '../../../../shared/utils/dates';
import { createId } from '../../../../shared/utils/ids';
import { Supplier } from '../../domain/entities/Supplier';
import { SupplierRepository } from '../../domain/repositories/SupplierRepository';
import { SupplierInputDto, supplierSchema } from '../dtos/SupplierDtos';

export class CreateSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  async execute(input: SupplierInputDto) {
    const dto = supplierSchema.parse(input);
    const timestamp = nowIso();
    const supplier: Supplier = {
      id: createId('sup'),
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      contactName: dto.contactName,
      notes: dto.notes,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.repository.create(supplier);
    return supplier;
  }
}

export class UpdateSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  async execute(id: string, input: SupplierInputDto) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new Error(`Proveedor no encontrado: ${id}`);
    }

    const dto = supplierSchema.parse(input);
    const updated: Supplier = {
      ...current,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      contactName: dto.contactName,
      notes: dto.notes,
      updatedAt: nowIso(),
    };
    await this.repository.update(updated);
    return updated;
  }
}

export class DeleteSupplierUseCase {
  constructor(private readonly repository: SupplierRepository) {}

  execute(id: string) {
    return this.repository.delete(id);
  }
}
