import { describe, expect, it } from 'vitest';
import {
  InMemoryFamilyRepository,
  makeFamily,
} from '../../../../__tests__/fakes';
import {
  CreateFamilyUseCase,
  DeleteFamilyUseCase,
  UpdateFamilyUseCase,
} from './FamilyUseCases';

describe('Family use cases', () => {
  it('creates a family with timestamps and persists it', async () => {
    const repository = new InMemoryFamilyRepository();
    const useCase = new CreateFamilyUseCase(repository);

    const family = await useCase.execute({ name: 'Audio' });

    expect(family.id).toMatch(/^fam_/);
    expect(family.name).toBe('Audio');
    expect(family.createdAt).toBeTruthy();
    expect(await repository.findById(family.id)).toEqual(family);
  });

  it('rejects empty family names', async () => {
    const repository = new InMemoryFamilyRepository();
    const useCase = new CreateFamilyUseCase(repository);

    await expect(useCase.execute({ name: '' })).rejects.toThrow();
  });

  it('updates an existing family', async () => {
    const repository = new InMemoryFamilyRepository();
    const original = makeFamily({ name: 'Original' });
    await repository.create(original);

    const updated = await new UpdateFamilyUseCase(repository).execute(original.id, {
      name: 'Actualizada',
    });

    expect(updated.name).toBe('Actualizada');
    expect(updated.updatedAt).not.toBe(original.updatedAt);
    expect(await repository.findById(original.id)).toEqual(updated);
  });

  it('fails when updating a missing family', async () => {
    const repository = new InMemoryFamilyRepository();

    await expect(
      new UpdateFamilyUseCase(repository).execute('missing', { name: 'Nueva' }),
    ).rejects.toThrow('Familia no encontrada');
  });

  it('deletes a family', async () => {
    const repository = new InMemoryFamilyRepository();
    const family = makeFamily();
    await repository.create(family);

    await new DeleteFamilyUseCase(repository).execute(family.id);

    expect(await repository.findById(family.id)).toBeNull();
  });
});
