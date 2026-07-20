import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Order } from '../../domain/entities/Order';

export function useOrders() {
  const { repositories } = useDependencies();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setOrders(await repositories.orders.findAll());
    setLoading(false);
  }, [repositories.orders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return { orders, loading, reload: loadOrders };
}
