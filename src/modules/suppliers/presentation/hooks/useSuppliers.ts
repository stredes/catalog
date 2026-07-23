import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Supplier } from '../../domain/entities/Supplier';

export function useSuppliers() {
  const { repositories } = useDependencies();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    const data = await repositories.suppliers.findAll();
    setSuppliers(data);
    setLoading(false);
  }, [repositories.suppliers]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  return { suppliers, loading, reload: loadSuppliers };
}
