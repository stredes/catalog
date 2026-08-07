import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { PurchaseDocument } from '../../domain/entities/PurchaseDocument';

export function usePurchaseOrders() {
  const { useCases } = useDependencies();
  const [orders, setOrders] = useState<PurchaseDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setOrders(await useCases.getPurchaseOrders.execute());
    setLoading(false);
  }, [useCases.getPurchaseOrders]);

  useEffect(() => { void reload(); }, [reload]);
  return { orders, loading, reload };
}
