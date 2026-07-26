export type DiscountType = 'none' | 'currency' | 'percentage';

export type CartContext = 'sale' | 'purchase';

export type CartItemBase<Context extends CartContext = CartContext> = {
  productId: string;
  productName: string;
  productCode?: string;
  unitPrice: number;
  quantity: number;
  format: string;
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  _context?: Context;
};

export function calculateSubtotal(
  unitPrice: number,
  quantity: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const base = unitPrice * quantity;
  if (discountType === 'currency') {
    return Math.max(0, base - discountValue);
  }
  if (discountType === 'percentage') {
    return Math.max(0, base * (1 - discountValue / 100));
  }
  return base;
}
