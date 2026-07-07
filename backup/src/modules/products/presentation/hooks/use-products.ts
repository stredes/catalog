import { useCallback, useEffect, useRef, useState } from 'react';
import { CreateProductUseCase } from '../../application/use-cases/create-product-use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product-use-case';
import { GetProductsByFamilyUseCase } from '../../application/use-cases/get-products-by-family-use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product-use-case';
import { SqliteProductRepository } from '../../infrastructure/repositories/sqlite-product-repository';
import { Product } from '../../domain/entities/product';
import { CreateProductDto } from '../../application/dtos/product-dto';

const repository = new SqliteProductRepository();
const createProductUseCase = new CreateProductUseCase(repository);
const updateProductUseCase = new UpdateProductUseCase(repository);
const deleteProductUseCase = new DeleteProductUseCase(repository);
const getProductsByFamilyUseCase = new GetProductsByFamilyUseCase(repository);

export function useProducts(familyId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProductsByFamilyUseCase.execute(familyId);
      if (mountedRef.current) {
        setProducts(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(`Error al cargar productos: ${err}`);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [familyId]);

  useEffect(() => {
    mountedRef.current = true;
    loadProducts();
    return () => { mountedRef.current = false; };
  }, [loadProducts]);

  const createProduct = async (input: CreateProductDto) => {
    try {
      const created = await createProductUseCase.execute(input);
      setProducts((prev) => [created, ...prev]);
    } catch (err) {
      setError(`Error al crear producto: ${err}`);
    }
  };

  const updateProduct = async (id: string, input: CreateProductDto) => {
    try {
      await updateProductUseCase.execute({ ...input, id });
      await loadProducts();
    } catch (err) {
      setError(`Error al actualizar producto: ${err}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteProductUseCase.execute(id);
      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      setError(`Error al eliminar producto: ${err}`);
    }
  };

  return { products, loading, error, createProduct, updateProduct, deleteProduct, refresh: loadProducts };
}
