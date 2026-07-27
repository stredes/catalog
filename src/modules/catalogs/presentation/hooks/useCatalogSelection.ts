import { useCallback, useMemo, useState } from 'react';
import { Product } from '../../../products/domain/entities/product';
import { Family } from '../../../families/domain/entities/Family';
import {
  getCatalogSelectedProducts,
  CatalogSelectionResult,
} from '../../domain/services/getCatalogSelectedProducts';

export type CatalogSelectionState = {
  selectedFamilyIds: string[];
  manuallySelectedProductIds: string[];
  excludedProductIds: string[];
  searchQuery: string;
  familyFilter: string | null;
  activeTab: 'families' | 'products';
};

export function useCatalogSelection(products: Product[], families: Family[]) {
  const [state, setState] = useState<CatalogSelectionState>({
    selectedFamilyIds: [],
    manuallySelectedProductIds: [],
    excludedProductIds: [],
    searchQuery: '',
    familyFilter: null,
    activeTab: 'families',
  });

  const productsByFamilyId = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const existing = map.get(product.familyId) ?? [];
      existing.push(product);
      map.set(product.familyId, existing);
    }
    return map;
  }, [products]);

  const familiesWithCount = useMemo(() => {
    return families.map((family) => ({
      ...family,
      productCount: productsByFamilyId.get(family.id)?.length ?? 0,
    }));
  }, [families, productsByFamilyId]);

  const isEveryFamilySelected = useMemo(
    () =>
      families.length > 0 &&
      state.selectedFamilyIds.length === families.length,
    [families.length, state.selectedFamilyIds.length],
  );

  const allFamiliesHaveProducts = useMemo(
    () => families.every((f) => (productsByFamilyId.get(f.id)?.length ?? 0) > 0),
    [families, productsByFamilyId],
  );

  const selectionResult: CatalogSelectionResult = useMemo(
    () =>
      getCatalogSelectedProducts({
        products,
        selectedFamilyIds: state.selectedFamilyIds,
        manuallySelectedProductIds: state.manuallySelectedProductIds,
        excludedProductIds: state.excludedProductIds,
      }),
    [products, state.selectedFamilyIds, state.manuallySelectedProductIds, state.excludedProductIds],
  );

  const filteredProducts = useMemo(() => {
    let result = products;
    if (state.familyFilter) {
      result = result.filter((p) => p.familyId === state.familyFilter);
    }
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query),
      );
    }
    return result;
  }, [products, state.familyFilter, state.searchQuery]);

  const toggleFamily = useCallback((familyId: string) => {
    setState((prev) => ({
      ...prev,
      selectedFamilyIds: prev.selectedFamilyIds.includes(familyId)
        ? prev.selectedFamilyIds.filter((id) => id !== familyId)
        : [...prev.selectedFamilyIds, familyId],
    }));
  }, []);

  const toggleProduct = useCallback((productId: string) => {
    setState((prev) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return prev;

      const isFromSelectedFamily = prev.selectedFamilyIds.includes(product.familyId);
      const isExcluded = prev.excludedProductIds.includes(productId);
      const isManuallySelected = prev.manuallySelectedProductIds.includes(productId);

      if (isFromSelectedFamily) {
        if (isExcluded) {
          return {
            ...prev,
            excludedProductIds: prev.excludedProductIds.filter((id) => id !== productId),
          };
        }
        return {
          ...prev,
          excludedProductIds: [...prev.excludedProductIds, productId],
        };
      }

      if (isManuallySelected) {
        return {
          ...prev,
          manuallySelectedProductIds: prev.manuallySelectedProductIds.filter(
            (id) => id !== productId,
          ),
        };
      }
      return {
        ...prev,
        manuallySelectedProductIds: [...prev.manuallySelectedProductIds, productId],
      };
    });
  }, [products]);

  const selectAllFamilies = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFamilyIds:
        prev.selectedFamilyIds.length === families.length
          ? []
          : families.map((f) => f.id),
    }));
  }, [families]);

  const setActiveTab = useCallback((tab: 'families' | 'products') => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setFamilyFilter = useCallback((familyId: string | null) => {
    setState((prev) => ({ ...prev, familyFilter: familyId }));
  }, []);

  const resetSelection = useCallback(() => {
    setState({
      selectedFamilyIds: [],
      manuallySelectedProductIds: [],
      excludedProductIds: [],
      searchQuery: '',
      familyFilter: null,
      activeTab: 'families',
    });
  }, []);

  const getProductStatus = useCallback((productId: string): 'included' | 'excluded' | 'none' => {
    if (state.excludedProductIds.includes(productId)) return 'excluded';
    if (selectionResult.selectedProductIds.includes(productId)) return 'included';
    return 'none';
  }, [state.excludedProductIds, selectionResult.selectedProductIds]);

  return {
    state,
    familiesWithCount,
    selectionResult,
    filteredProducts,
    isEveryFamilySelected,
    allFamiliesHaveProducts,
    toggleFamily,
    toggleProduct,
    selectAllFamilies,
    setActiveTab,
    setSearchQuery,
    setFamilyFilter,
    resetSelection,
    getProductStatus,
    hasSelection:
      selectionResult.selectedProductIds.length > 0 ||
      state.selectedFamilyIds.length > 0,
    canSubmit: selectionResult.selectedProductIds.length > 0,
  };
}
