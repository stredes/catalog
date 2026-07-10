export type ErrorCode =
  | 'FAMILY_NOT_FOUND'
  | 'FAMILY_DUPLICATE'
  | 'PRODUCT_NOT_FOUND'
  | 'CATALOG_NOT_FOUND'
  | 'CATALOG_PDF_GENERATION_FAILED'
  | 'CATALOG_PDF_EMPTY'
  | 'CATALOG_PDF_MEMORY'
  | 'CATALOG_NO_FAMILY_SELECTED'
  | 'CATALOG_NO_PRODUCTS_SELECTED'
  | 'SHARE_UNAVAILABLE'
  | 'IMAGE_PICKER_DENIED'
  | 'DATABASE_ERROR'
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly cause?: Error;

  constructor(code: ErrorCode, message: string, cause?: Error) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

export function familyNotFoundError(id: string) {
  return new AppError('FAMILY_NOT_FOUND', `Familia no encontrada: ${id}`);
}

export function familyDuplicateError(name: string) {
  return new AppError('FAMILY_DUPLICATE', `Ya existe una familia con el nombre "${name}"`);
}

export function productNotFoundError(id: string) {
  return new AppError('PRODUCT_NOT_FOUND', `Producto no encontrado: ${id}`);
}

export function catalogNotFoundError(id: string) {
  return new AppError('CATALOG_NOT_FOUND', `Catálogo no encontrado: ${id}`);
}

export function catalogNoFamilySelectedError() {
  return new AppError('CATALOG_NO_FAMILY_SELECTED', 'Selecciona al menos una familia');
}

export function catalogPdfGenerationError(message?: string, cause?: Error) {
  return new AppError(
    'CATALOG_PDF_GENERATION_FAILED',
    message ?? 'No se pudo generar el catálogo. Intenta nuevamente.',
    cause,
  );
}

export function catalogPdfEmptyError() {
  return new AppError('CATALOG_PDF_EMPTY', 'El PDF generado está vacío o no se pudo copiar correctamente.');
}

export function catalogPdfMemoryError() {
  return new AppError(
    'CATALOG_PDF_MEMORY',
    'No pudimos generar el catálogo porque las imágenes requieren demasiada memoria. Intenta nuevamente.',
  );
}

export function shareUnavailableError() {
  return new AppError('SHARE_UNAVAILABLE', 'Compartir no está disponible en este dispositivo');
}

export function imagePickerDeniedError(source: 'camera' | 'gallery') {
  const label = source === 'camera' ? 'cámara' : 'galería';
  return new AppError('IMAGE_PICKER_DENIED', `Permiso de ${label} denegado`);
}

export function databaseError(message: string, cause?: Error) {
  return new AppError('DATABASE_ERROR', message, cause);
}
