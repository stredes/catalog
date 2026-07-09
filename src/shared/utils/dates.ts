export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL');
}
