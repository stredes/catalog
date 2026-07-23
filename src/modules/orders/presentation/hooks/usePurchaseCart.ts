import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { PurchaseCartItem } from '../../domain/entities/PurchaseCartItem';

export function usePurchaseCart() {
  const { repositories } = useDependencies();
  const [items, setItems] = useState<PurchaseCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setItems(await repositories.purchaseCart.getItems());
    setLoading(false);
  }, [repositories.purchaseCart]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  return { items, loading, reload: loadItems, totalItems, subtotal };
}
