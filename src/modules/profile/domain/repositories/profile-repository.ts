import { Profile } from '../entities/profile';

export interface ProfileRepository {
  save(profile: Profile): Promise<void>;
  find(): Promise<Profile | null>;
  delete(id: string): Promise<void>;
}
