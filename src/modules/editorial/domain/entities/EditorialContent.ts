export type EditorialMode = 'basic' | 'auto' | 'custom';

export type EditorialSectionContent = {
  title: string;
  subtitle: string;
  welcomeMessage: string;
  introduction: string;
};

export type EditorialAboutContent = {
  description: string;
  history: string;
  mission: string;
  vision: string;
  values: string;
};

export type EditorialCategoryContent = {
  familyId: string;
  description: string;
};

export type EditorialProductContent = {
  productId: string;
  savedForFuture: boolean;
  description: string;
  benefits: string;
  highlights: string;
  uses: string;
  specifications: string;
  quote: string;
  notes: string;
};

export type EditorialContent = {
  mode: EditorialMode;
  section: EditorialSectionContent;
  about: EditorialAboutContent;
  categories: EditorialCategoryContent[];
  products: EditorialProductContent[];
};

export function createEmptyEditorialContent(): EditorialContent {
  return {
    mode: 'basic',
    section: { title: '', subtitle: '', welcomeMessage: '', introduction: '' },
    about: { description: '', history: '', mission: '', vision: '', values: '' },
    categories: [],
    products: [],
  };
}

export function createProductEditorialContent(productId: string): EditorialProductContent {
  return {
    productId,
    savedForFuture: false,
    description: '',
    benefits: '',
    highlights: '',
    uses: '',
    specifications: '',
    quote: '',
    notes: '',
  };
}

export function createCategoryEditorialContent(familyId: string): EditorialCategoryContent {
  return { familyId, description: '' };
}
