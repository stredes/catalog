export type OptimizedCatalogImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
};

export interface CatalogImageOptimizer {
  optimizeForPdf(
    imageUri: string,
    productId: string,
    maxDimension?: number,
  ): Promise<OptimizedCatalogImage | null>;
  clearCache(): Promise<void>;
}
