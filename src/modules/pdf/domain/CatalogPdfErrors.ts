export class CatalogPdfGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
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
  }
}
