import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Quotation } from '../../domain/entities/Quotation';

export function useQuotations() {
  const { repositories } = useDependencies();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    setQuotations(await repositories.quotations.findAll());
    setLoading(false);
  }, [repositories.quotations]);

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  return { quotations, loading, reload: loadQuotations };
}
