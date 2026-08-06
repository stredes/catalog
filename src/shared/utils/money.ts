const integerFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  return Number.isInteger(amount) ? integerFormatter.format(amount) : decimalFormatter.format(amount);
}

export const formatMoneyCLP = formatMoney;

export function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [integer, ...decimalParts] = cleaned.split('.');
  if (decimalParts.length === 0) return integer;
  return `${integer}.${decimalParts.join('')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
