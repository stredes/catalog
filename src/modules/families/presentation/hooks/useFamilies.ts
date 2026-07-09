import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Family } from '../../domain/entities/Family';

export function useFamilies() {
  const { repositories, useCases } = useDependencies();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFamilies = useCallback(async () => {
    setLoading(true);
    const data = await repositories.families.findAll();

    if (data.length === 0) {
      await useCases.createFamily.execute({ name: 'General' });
      setFamilies(await repositories.families.findAll());
    } else {
      setFamilies(data);
    }

    setLoading(false);
  }, [repositories.families, useCases.createFamily]);

  useEffect(() => {
    void loadFamilies();
  }, [loadFamilies]);

  return { families, loading, reload: loadFamilies };
}
