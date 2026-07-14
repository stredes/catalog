import { PdfCatalogInput } from '../../domain/PdfGenerator';

export type EditorialProduct = PdfCatalogInput['products'][number] & {
  pdfImageSrc?: string | null;
};

export type EditorialProfile = NonNullable<PdfCatalogInput['profile']> & {
  pdfLogoSrc?: string | null;
};

export type EditorialFamily = PdfCatalogInput['families'][number];

export type EditorialPageSpec = {
  key: string;
  title: string;
  html: string;
  includeInToc?: boolean;
};
