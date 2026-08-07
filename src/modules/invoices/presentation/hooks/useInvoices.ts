import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Invoice } from '../../domain/entities/Invoice';

export function useInvoices() {
  const { repositories } = useDependencies();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    const data = await repositories.invoices.findAll();
    setInvoices(data);
    setLoading(false);
  }, [repositories.invoices]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  return { invoices, loading, reload: loadInvoices };
}
