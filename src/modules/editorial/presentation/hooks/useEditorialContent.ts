import { useCallback, useMemo, useState } from 'react';
import { Product } from '../../../products/domain/entities/Product';
import { Family } from '../../../families/domain/entities/Family';
import {
  EditorialContent,
  EditorialMode,
  EditorialSectionContent,
  EditorialAboutContent,
  EditorialCategoryContent,
  EditorialProductContent,
  createEmptyEditorialContent,
  createCategoryEditorialContent,
  createProductEditorialContent,
} from '../../domain/entities/EditorialContent';
import {
  GenerateEditorialContentUseCase,
  GenerateSectionContentUseCase,
  GenerateAboutContentUseCase,
  GenerateCategoryContentUseCase,
  GenerateProductContentUseCase,
} from '../../application/use-cases/EditorialContentUseCases';

export function useEditorialContent(
  families: Family[],
  products: Product[],
  businessName: string,
) {
  const [content, setContent] = useState<EditorialContent>(createEmptyEditorialContent);

  const generateAll = useMemo(() => new GenerateEditorialContentUseCase(), []);
  const generateSection = useMemo(() => new GenerateSectionContentUseCase(), []);
  const generateAbout = useMemo(() => new GenerateAboutContentUseCase(), []);
  const generateCategory = useMemo(() => new GenerateCategoryContentUseCase(), []);
  const generateProduct = useMemo(() => new GenerateProductContentUseCase(), []);

  const setMode = useCallback((mode: EditorialMode) => {
    setContent((prev) => ({ ...prev, mode }));
  }, []);

  const updateSection = useCallback((field: keyof EditorialSectionContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      section: { ...prev.section, [field]: value },
    }));
  }, []);

  const updateAbout = useCallback((field: keyof EditorialAboutContent, value: string) => {
    setContent((prev) => ({
      ...prev,
      about: { ...prev.about, [field]: value },
    }));
  }, []);

  const updateCategoryDescription = useCallback((familyId: string, value: string) => {
    setContent((prev) => {
      const existing = prev.categories.find((c) => c.familyId === familyId);
      if (existing) {
        return {
          ...prev,
          categories: prev.categories.map((c) =>
            c.familyId === familyId ? { ...c, description: value } : c,
          ),
        };
      }
      return {
        ...prev,
        categories: [...prev.categories, { familyId, description: value }],
      };
    });
  }, []);

  const updateProductField = useCallback(
    (productId: string, field: keyof EditorialProductContent, value: string | boolean) => {
      setContent((prev) => {
        const existing = prev.products.find((p) => p.productId === productId);
        if (existing) {
          return {
            ...prev,
            products: prev.products.map((p) =>
              p.productId === productId ? { ...p, [field]: value } : p,
            ),
          };
        }
        const newProduct = createProductEditorialContent(productId);
        return {
          ...prev,
          products: [...prev.products, { ...newProduct, [field]: value }],
        };
      });
    },
    [],
  );

  const autoGenerateAll = useCallback(() => {
    const result = generateAll.execute(families, products, businessName);
    setContent(result);
  }, [generateAll, families, products, businessName]);

  const autoGenerateSection = useCallback(() => {
    const section = generateSection.execute(families, products, businessName);
    setContent((prev) => ({ ...prev, section, mode: prev.mode === 'basic' ? 'auto' : prev.mode }));
  }, [generateSection, families, products, businessName]);

  const autoGenerateAbout = useCallback(() => {
    const about = generateAbout.execute(businessName);
    setContent((prev) => ({ ...prev, about, mode: prev.mode === 'basic' ? 'auto' : prev.mode }));
  }, [generateAbout, businessName]);

  const autoGenerateCategory = useCallback(
    (familyId: string) => {
      const family = families.find((f) => f.id === familyId);
      if (!family) return;
      const productCount = products.filter((p) => p.familyId === familyId).length;
      const desc = generateCategory.execute(family.name, productCount);
      updateCategoryDescription(familyId, desc);
    },
    [generateCategory, families, products, updateCategoryDescription],
  );

  const autoGenerateProductField = useCallback(
    (productId: string, field: 'description' | 'benefits' | 'highlights' | 'uses' | 'specifications' | 'quote') => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const familyName = families.find((f) => f.id === product.familyId)?.name ?? '';
      const value = generateProduct.executeField(product, familyName, field);
      updateProductField(productId, field, value);
    },
    [generateProduct, products, families, updateProductField],
  );

  const initCategories = useCallback(() => {
    setContent((prev) => {
      const existingIds = new Set(prev.categories.map((c) => c.familyId));
      const newCategories = families
        .filter((f) => !existingIds.has(f.id))
        .map((f) => createCategoryEditorialContent(f.id));
      return { ...prev, categories: [...prev.categories, ...newCategories] };
    });
  }, [families]);

  const initProducts = useCallback(() => {
    setContent((prev) => {
      const existingIds = new Set(prev.products.map((p) => p.productId));
      const newProducts = products
        .filter((p) => !existingIds.has(p.id))
        .map((p) => createProductEditorialContent(p.id));
      return { ...prev, products: [...prev.products, ...newProducts] };
    });
  }, [products]);

  const hasContent = useMemo(() => {
    if (content.mode === 'basic') return true;
    const s = content.section;
    const hasSectionText = s.title || s.subtitle || s.welcomeMessage || s.introduction;
    const hasAboutText = content.about.description || content.about.mission;
    const hasCategoryText = content.categories.some((c) => c.description);
    const hasProductText = content.products.some(
      (p) => p.description || p.benefits || p.quote,
    );
    return hasSectionText || hasAboutText || hasCategoryText || hasProductText;
  }, [content]);

  return {
    content,
    setMode,
    updateSection,
    updateAbout,
    updateCategoryDescription,
    updateProductField,
    autoGenerateAll,
    autoGenerateSection,
    autoGenerateAbout,
    autoGenerateCategory,
    autoGenerateProductField,
    initCategories,
    initProducts,
    hasContent,
  };
}
