import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../../../__tests__/fakes';
import { getCatalogSelectedProducts } from './getCatalogSelectedProducts';

describe('getCatalogSelectedProducts', () => {
  const products = [
    makeProduct({ id: 'prd_1', name: 'Taza blanca', familyId: 'fam_tazas' }),
    makeProduct({ id: 'prd_2', name: 'Taza sublimada', familyId: 'fam_tazas' }),
    makeProduct({ id: 'prd_3', name: 'Polera algodon', familyId: 'fam_poleras' }),
    makeProduct({ id: 'prd_4', name: 'Polera estampada', familyId: 'fam_poleras' }),
    makeProduct({ id: 'prd_5', name: 'Llavero metal', familyId: 'fam_llaveros' }),
  ];

  it('returns all products from selected families', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas'],
      manuallySelectedProductIds: [],
      excludedProductIds: [],
    });

    expect(result.selectedProductIds).toEqual(['prd_1', 'prd_2']);
    expect(result.selectedFamiliesCount).toBe(1);
    expect(result.totalProductsCount).toBe(2);
    expect(result.excludedProductsCount).toBe(0);
  });

  it('returns products from multiple selected families', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas', 'fam_poleras'],
      manuallySelectedProductIds: [],
      excludedProductIds: [],
    });

    expect(result.selectedProductIds).toEqual(['prd_1', 'prd_2', 'prd_3', 'prd_4']);
    expect(result.selectedFamiliesCount).toBe(2);
    expect(result.totalProductsCount).toBe(4);
  });

  it('excludes manually excluded products from selected families', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas'],
      manuallySelectedProductIds: [],
      excludedProductIds: ['prd_2'],
    });

    expect(result.selectedProductIds).toEqual(['prd_1']);
    expect(result.totalProductsCount).toBe(1);
    expect(result.excludedProductsCount).toBe(1);
  });

  it('includes manually selected products from non-selected families', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas'],
      manuallySelectedProductIds: ['prd_5'],
      excludedProductIds: [],
    });

    expect(result.selectedProductIds).toEqual(['prd_1', 'prd_2', 'prd_5']);
    expect(result.selectedFamiliesCount).toBe(1);
    expect(result.totalProductsCount).toBe(3);
  });

  it('does not duplicate products present in both family and manual selection', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas'],
      manuallySelectedProductIds: ['prd_1'],
      excludedProductIds: [],
    });

    expect(result.selectedProductIds).toEqual(['prd_1', 'prd_2']);
    expect(result.totalProductsCount).toBe(2);
  });

  it('returns empty result when no families or products selected', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: [],
      manuallySelectedProductIds: [],
      excludedProductIds: [],
    });

    expect(result.selectedProductIds).toEqual([]);
    expect(result.selectedFamiliesCount).toBe(0);
    expect(result.totalProductsCount).toBe(0);
  });

  it('excluded products take precedence over family products', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas', 'fam_poleras'],
      manuallySelectedProductIds: [],
      excludedProductIds: ['prd_1', 'prd_3'],
    });

    expect(result.selectedProductIds).toEqual(['prd_2', 'prd_4']);
    expect(result.totalProductsCount).toBe(2);
    expect(result.excludedProductsCount).toBe(2);
  });

  it('handles mixed selection with exclusions correctly', () => {
    const result = getCatalogSelectedProducts({
      products,
      selectedFamilyIds: ['fam_tazas'],
      manuallySelectedProductIds: ['prd_5'],
      excludedProductIds: ['prd_2'],
    });

    expect(result.selectedProductIds).toEqual(['prd_1', 'prd_5']);
    expect(result.selectedFamiliesCount).toBe(1);
    expect(result.totalProductsCount).toBe(2);
    expect(result.excludedProductsCount).toBe(1);
  });
});
