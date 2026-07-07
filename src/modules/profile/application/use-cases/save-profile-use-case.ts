import { Profile } from '../../domain/entities/profile';
import { ProfileRepository } from '../../domain/repositories/profile-repository';
import { ProfileDto, profileSchema } from '../dtos/profile-dto';

function generateId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export class SaveProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(input: ProfileDto): Promise<Profile> {
    const data = profileSchema.parse(input);
    const now = new Date().toISOString();

    const existing = await this.repository.find();
    if (existing) {
      const updated = new Profile(
        existing.id,
        data.name,
        data.email,
        data.phone,
        data.company,
        data.address,
        data.photoUri,
        data.rut,
        existing.createdAt,
        now,
      );
      await this.repository.save(updated);
      return updated;
    }

    const profile = new Profile(
      generateId(),
      data.name,
      data.email,
      data.phone,
      data.company,
      data.address,
      data.photoUri,
      data.rut,
      now,
      now,
    );
    await this.repository.save(profile);
    return profile;
  }
}
