import { useCallback, useEffect, useState } from 'react';
import { SqliteProfileRepository } from '../../infrastructure/repositories/sqlite-profile-repository';
import { GetProfileUseCase } from '../../application/use-cases/get-profile-use-case';
import { SaveProfileUseCase } from '../../application/use-cases/save-profile-use-case';
import { DeleteProfileUseCase } from '../../application/use-cases/delete-profile-use-case';
import { Profile } from '../../domain/entities/profile';
import { ProfileDto } from '../../application/dtos/profile-dto';

const repository = new SqliteProfileRepository();
const getProfileUseCase = new GetProfileUseCase(repository);
const saveProfileUseCase = new SaveProfileUseCase(repository);
const deleteProfileUseCase = new DeleteProfileUseCase(repository);

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProfileUseCase.execute();
      setProfile(result);
    } catch (err) {
      setError(`Error al cargar perfil: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async (input: ProfileDto) => {
    try {
      setError(null);
      const saved = await saveProfileUseCase.execute(input);
      setProfile(saved);
    } catch (err) {
      setError(`Error al guardar perfil: ${err}`);
    }
  };

  const deleteProfile = async () => {
    if (!profile) return;
    try {
      setError(null);
      await deleteProfileUseCase.execute(profile.id);
      setProfile(null);
    } catch (err) {
      setError(`Error al eliminar perfil: ${err}`);
    }
  };

  return { profile, loading, error, saveProfile, deleteProfile, refresh: loadProfile };
}
