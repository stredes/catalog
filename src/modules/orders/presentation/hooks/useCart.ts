import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { CartItem } from '../../domain/entities/CartItem';

export function useCart() {
  const { repositories } = useDependencies();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setItems(await repositories.cart.getItems());
    setLoading(false);
  }, [repositories.cart]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  return { items, loading, reload: loadItems, totalItems, subtotal, iva, total };
}
