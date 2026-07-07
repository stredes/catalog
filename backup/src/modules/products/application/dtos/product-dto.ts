export interface CreateProductDto {
  name: string;
  price: number;
  format: 'grid-2' | 'grid-3' | 'list' | 'premium';
  photoUri: string | null;
  familyId: string;
}

export interface UpdateProductDto extends CreateProductDto {
  id: string;
}
