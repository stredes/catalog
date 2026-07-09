import { Profile } from '../entities/Profile';

export interface ProfileRepository {
  find(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}
