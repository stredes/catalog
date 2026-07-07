import { ProfileRepository } from '../../domain/repositories/profile-repository';

export class GetProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute() {
    return this.repository.find();
  }
}
