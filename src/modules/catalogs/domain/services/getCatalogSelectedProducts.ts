import { Product } from '../../../products/domain/entities/product';

export type CatalogSelectionInput = {
  products: Product[];
  selectedFamilyIds: string[];
  manuallySelectedProductIds: string[];
  excludedProductIds: string[];
};

export type CatalogSelectionResult = {
  selectedProducts: Product[];
  selectedProductIds: string[];
  selectedFamiliesCount: number;
  totalProductsCount: number;
  excludedProductsCount: number;
};

export function getCatalogSelectedProducts(
  input: CatalogSelectionInput,
): CatalogSelectionResult {
  const {
    products,
    selectedFamilyIds,
    manuallySelectedProductIds,
    excludedProductIds,
  } = input;

  const excludedSet = new Set(excludedProductIds);
  const manuallySelectedSet = new Set(manuallySelectedProductIds);

  const productsFromFamilies = products.filter(
    (p) => selectedFamilyIds.includes(p.familyId),
  );

  const manuallySelectedProducts = products.filter(
    (p) => manuallySelectedSet.has(p.id) && !selectedFamilyIds.includes(p.familyId),
  );

  const combined = new Map<string, Product>();

  for (const product of productsFromFamilies) {
    combined.set(product.id, product);
  }

  for (const product of manuallySelectedProducts) {
    if (!combined.has(product.id)) {
      combined.set(product.id, product);
    }
  }

  const selectedProducts = Array.from(combined.values()).filter(
    (p) => !excludedSet.has(p.id),
  );

  return {
    selectedProducts,
    selectedProductIds: selectedProducts.map((p) => p.id),
    selectedFamiliesCount: selectedFamilyIds.length,
    totalProductsCount: selectedProducts.length,
    excludedProductsCount: excludedProductIds.length,
  };
}
