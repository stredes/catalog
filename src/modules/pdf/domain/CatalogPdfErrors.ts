import { AppError } from '../../../shared/errors/AppError';

export class CatalogPdfGenerationError extends AppError {
  constructor(message: string, cause?: Error) {
    super('CATALOG_PDF_GENERATION_FAILED', message, cause);
    this.name = 'CatalogPdfGenerationError';
  }
}

export class CatalogImageOptimizationError extends CatalogPdfGenerationError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'CatalogImageOptimizationError';
  }
}

export class CatalogPdfMemoryError extends CatalogPdfGenerationError {
  constructor() {
    super(
      'No pudimos generar el catálogo porque las imágenes requieren demasiada memoria. ' +
      'Estamos optimizando el contenido. Intenta nuevamente.',
    );
    this.name = 'CatalogPdfMemoryError';
    (this as { code: string }).code = 'CATALOG_PDF_MEMORY';
  }
}
