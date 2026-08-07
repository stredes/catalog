export function calculateTax(netAmount: number): number {
  return Math.round(netAmount * 0.19);
}

export function calculateInvoiceTotal(netAmount: number, taxAmount: number): number {
  return netAmount + taxAmount;
}
