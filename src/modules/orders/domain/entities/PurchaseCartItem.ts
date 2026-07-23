export type PurchaseDiscountType = 'none' | 'currency' | 'percentage';

export type PurchaseCartItem = {
  productId: string;
  productName: string;
  productCode?: string;
  unitPrice: number;
  quantity: number;
  format: string;
  discountType: PurchaseDiscountType;
  discountValue: number;
  subtotal: number;
};

export function calculatePurchaseSubtotal(
  unitPrice: number,
  quantity: number,
  discountType: PurchaseDiscountType,
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
