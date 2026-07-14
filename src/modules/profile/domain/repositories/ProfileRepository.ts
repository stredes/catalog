import { Profile } from '../entities/profile';

export interface ProfileRepository {
  find(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}
