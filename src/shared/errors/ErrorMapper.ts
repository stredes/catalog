import { AppError, ErrorCode } from './AppError';

const errorMessages: Record<ErrorCode, string> = {
  FAMILY_NOT_FOUND: 'La familia solicitada no existe.',
  FAMILY_DUPLICATE: 'Ya existe una familia con ese nombre.',
  PRODUCT_NOT_FOUND: 'El producto solicitado no existe.',
  CATALOG_NOT_FOUND: 'El catálogo no fue encontrado.',
  CATALOG_PDF_GENERATION_FAILED: 'No se pudo generar el catálogo. Intenta nuevamente.',
  CATALOG_PDF_EMPTY: 'El PDF generado está vacío.',
  CATALOG_PDF_MEMORY: 'Las imágenes requieren demasiada memoria. Intenta con menos fotos.',
  CATALOG_NO_FAMILY_SELECTED: 'Selecciona al menos una familia.',
  CATALOG_NO_PRODUCTS_SELECTED: 'Selecciona al menos un producto.',
  SHARE_UNAVAILABLE: 'Compartir no está disponible en este dispositivo.',
  IMAGE_PICKER_DENIED: 'Permiso denegado. Habilita el permiso desde Configuración.',
  DATABASE_ERROR: 'Ocurrió un error con la base de datos.',
  UNKNOWN: 'Ocurrió un error inesperado.',
};

export function mapErrorToMessage(error: unknown): string {
  if (error instanceof AppError) {
    return errorMessages[error.code] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return errorMessages.UNKNOWN;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
