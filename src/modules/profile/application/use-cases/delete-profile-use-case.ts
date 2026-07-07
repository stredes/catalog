import { ProfileRepository } from '../../domain/repositories/profile-repository';

export class DeleteProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
