export type ProductFormat = 'unit' | 'box' | 'pack' | 'service';

export type Product = {
  id: string;
  name: string;
  code?: string;
  price: number;
  stock: number;
  format: ProductFormat;
  photoUri?: string;
  familyId: string;
  createdAt: string;
  updatedAt: string;
};
