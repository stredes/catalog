export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL');
}

export function isValidISODate(value: string): boolean {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return value === date.toISOString().slice(0, 10);
}
