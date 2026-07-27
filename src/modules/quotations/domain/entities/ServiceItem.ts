export type ServiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export function calculateServiceSubtotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice);
}
