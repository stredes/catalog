import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Catalog } from '../../domain/entities/Catalog';

export function useCatalogs() {
  const { repositories } = useDependencies();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    setCatalogs(await repositories.catalogs.findAll());
    setLoading(false);
  }, [repositories.catalogs]);

  useEffect(() => {
    void loadCatalogs();
  }, [loadCatalogs]);

  return { catalogs, loading, reload: loadCatalogs };
}
