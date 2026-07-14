import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Profile } from '../../domain/entities/profile';

export function useProfile() {
  const { useCases } = useDependencies();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setProfile(await useCases.getProfile.execute());
    setLoading(false);
  }, [useCases]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, profile, reload };
}
