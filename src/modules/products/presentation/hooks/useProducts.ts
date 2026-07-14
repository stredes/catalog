import { useCallback, useEffect, useState } from 'react';
import { useDependencies } from '../../../../bootstrap/dependencies';
import { Product } from '../../domain/entities/product';

export function useProducts() {
  const { repositories } = useDependencies();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setProducts(await repositories.products.findAll());
    setLoading(false);
  }, [repositories.products]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  return { products, loading, reload: loadProducts };
}
