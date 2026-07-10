import { nowIso } from '../../../../shared/utils/dates';
import { ImagePickerService, ImageSource } from '../../../products/domain/repositories/ImagePickerService';
import { Profile } from '../../domain/entities/Profile';
import { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import { ProfileInputDto, profileSchema } from '../dtos/ProfileDtos';

export class GetProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  execute() {
    return this.repository.find();
  }
}

export class SaveProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(input: ProfileInputDto) {
    const dto = profileSchema.parse(input);
    const profile: Profile = {
      id: 'profile',
      businessName: dto.businessName,
      ownerName: dto.ownerName || undefined,
      phone: dto.phone || undefined,
      email: dto.email || undefined,
      address: dto.address || undefined,
      website: dto.website || undefined,
      logoUri: dto.logoUri,
      bankName: dto.bankName || undefined,
      bankAccountType: dto.bankAccountType || undefined,
      bankAccountNumber: dto.bankAccountNumber || undefined,
      updatedAt: nowIso(),
    };

    await this.repository.save(profile);
    return profile;
  }
}

export class PickProfileLogoUseCase {
  constructor(private readonly imagePicker: ImagePickerService) {}

  execute(source: ImageSource = 'gallery') {
    return this.imagePicker.pickImage(source);
  }
}
