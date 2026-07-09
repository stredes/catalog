const formatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return formatter.format(Number.isFinite(value) ? value : 0);
}
