export type CartItem = {
  productId: string;
  productName: string;
  productCode?: string;
  unitPrice: number;
  quantity: number;
  format: string;
  subtotal: number;
};
