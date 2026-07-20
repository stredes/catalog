import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import { formatMoney } from '../../../shared/utils/money';
import { processWithConcurrency } from '../../../shared/utils/concurrency';
import { CatalogFormat } from '../../catalogs/domain/entities/Catalog';
import {
  CatalogPdfGenerationError,
  CatalogPdfMemoryError,
} from '../domain/CatalogPdfErrors';
import { PdfCatalogInput, PdfGenerationProgress, PdfGenerator } from '../domain/PdfGenerator';
import { CatalogImageOptimizer } from '../domain/CatalogImageOptimizer';
import { ExpoCatalogImageOptimizer } from './ExpoCatalogImageOptimizer';
import { buildEditorialCatalogHtml } from '../templates/editorial';

const IMAGE_CONCURRENCY = 2;

const MAX_DIMENSIONS: Record<CatalogFormat, number> = {
  'grid-2': 480,
  'grid-3': 480,
  'grid-4x5': 300,
  'grid-3x7': 300,
  'simple-list': 480,
  'premium-cover': 480,
};

const whatsappSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366" style="vertical-align:middle;margin-left:6px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'catalogo';
}

function chunkProducts<T>(items: readonly T[], columns: number): T[][] {
  if (columns <= 0) throw new Error('columns must be > 0');
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
}

type Layout = {
  columns: number;
  rowsFirstPage: number;
  rowsPerPage: number;
  imageHeightMm: number;
  cardHeightMm: number;
  compact: boolean;
};

const PAGE_HEIGHT_MM = 273;
const FIRST_PAGE_OVERHEAD_MM = 52;

function layoutFor(format: CatalogFormat): Layout {
  const configs: Record<CatalogFormat, {
    columns: number;
    rowsPerPage?: number;
    imageHeightMm: number;
    cardHeightMm: number;
  }> = {
    'grid-2': { columns: 2, imageHeightMm: 36, cardHeightMm: 57 },
    'grid-3': { columns: 3, imageHeightMm: 29, cardHeightMm: 50 },
    'grid-4x5': { columns: 4, rowsPerPage: 5, imageHeightMm: 27, cardHeightMm: 47 },
    'grid-3x7': { columns: 3, rowsPerPage: 7, imageHeightMm: 21, cardHeightMm: 36 },
    'simple-list': { columns: 1, imageHeightMm: 28, cardHeightMm: 39 },
    'premium-cover': { columns: 2, imageHeightMm: 38, cardHeightMm: 60 },
  };

  const cfg = configs[format];
  const compact = format === 'grid-4x5' || format === 'grid-3x7';
  const rowHeight = cfg.cardHeightMm + (compact ? 2 : 3);

  let rowsPerPage: number;
  if (cfg.rowsPerPage) {
    rowsPerPage = cfg.rowsPerPage;
  } else {
    rowsPerPage = Math.max(1, Math.floor(PAGE_HEIGHT_MM / rowHeight));
  }

  const rowsFirstPage = Math.max(1, Math.floor((PAGE_HEIGHT_MM - FIRST_PAGE_OVERHEAD_MM) / rowHeight));

  return {
    columns: cfg.columns,
    rowsFirstPage,
    rowsPerPage,
    imageHeightMm: cfg.imageHeightMm,
    cardHeightMm: cfg.cardHeightMm,
    compact,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type PrintableProduct = PdfCatalogInput['products'][number] & {
  pdfImageSrc: string | null | undefined;
};

type PrintableProfile = NonNullable<PdfCatalogInput['profile']> & {
  pdfLogoSrc: string | null | undefined;
};

export class ExpoPdfGenerator implements PdfGenerator {
  private readonly imageOptimizer: CatalogImageOptimizer;

  constructor(imageOptimizer?: CatalogImageOptimizer) {
    this.imageOptimizer = imageOptimizer ?? new ExpoCatalogImageOptimizer();
  }

  async generate(
    input: PdfCatalogInput,
    onProgress?: (progress: PdfGenerationProgress) => void,
  ) {
    const emit = (stage: PdfGenerationProgress['stage'], overrides?: Partial<PdfGenerationProgress>) => {
      onProgress?.({ stage, ...overrides });
    };

    try {
      emit('preparing', { message: 'Preparando catálogo...' });

      const maxDimension = MAX_DIMENSIONS[input.format] ?? 480;

      emit('optimizing-images', {
        message: 'Optimizando imágenes...',
        current: 0,
        total: input.products.length,
      });

      const productsForPdf = await this.prepareProductsForPdf(
        input.products,
        maxDimension,
        (current, total) => {
          emit('optimizing-images', {
            current,
            total,
            message: `Optimizando imágenes ${current} de ${total}...`,
          });
        },
      );

      emit('building-document', { message: 'Construyendo documento...' });

      const profile = await this.prepareProfileForPdf(input, maxDimension);
      const html = this.buildHtml(input, productsForPdf, profile);

      emit('generating-pdf', { message: 'Generando PDF...' });

      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const pdfDirectory = new Directory(Paths.document, 'catalog-pdfs');
      pdfDirectory.create({ idempotent: true, intermediates: true });

      const source = new File(file.uri);
      const destination = new File(
        pdfDirectory,
        `${sanitizeFileName(input.catalogName)}-${Date.now()}.pdf`,
      );

      source.copy(destination);

      if (!destination.exists || destination.size === 0) {
        throw new CatalogPdfGenerationError(
          'El PDF generado está vacío o no se pudo copiar correctamente.',
        );
      }

      emit('completed', { message: 'Catálogo listo.' });

      return destination.uri;
    } catch (error) {
      if (error instanceof CatalogPdfGenerationError) {
        throw error;
      }

      if (
        error instanceof Error &&
        (error.message.includes('OutOfMemoryError') ||
          error.message.includes('Failed to allocate'))
      ) {
        throw new CatalogPdfMemoryError();
      }

      throw new CatalogPdfGenerationError(
        'No se pudo generar el catálogo. Intenta nuevamente.',
        error instanceof Error ? error : undefined,
      );
    }
  }

  private async prepareProductsForPdf(
    products: PdfCatalogInput['products'],
    maxDimension: number,
    onProgress: (current: number, total: number) => void,
  ): Promise<PrintableProduct[]> {
    const total = products.length;

    const results = await processWithConcurrency(
      products,
      IMAGE_CONCURRENCY,
      async (product, index) => {
        let pdfImageSrc: string | null | undefined;

        if (product.photoUri) {
          const optimized = await this.imageOptimizer.optimizeForPdf(
            product.photoUri,
            product.id,
            maxDimension,
          );
          pdfImageSrc = optimized?.uri ?? null;
        }

        onProgress(index + 1, total);

        return {
          ...product,
          pdfImageSrc,
        };
      },
    );

    return results;
  }

  private async prepareProfileForPdf(
    input: PdfCatalogInput,
    maxDimension: number,
  ): Promise<PrintableProfile | undefined> {
    if (!input.profile) {
      return undefined;
    }

    let pdfLogoSrc: string | null | undefined;

    if (input.profile.logoUri) {
      const optimized = await this.imageOptimizer.optimizeForPdf(
        input.profile.logoUri,
        'profile-logo',
        maxDimension,
      );
      pdfLogoSrc = optimized?.uri ?? null;
    }

    return {
      ...input.profile,
      pdfLogoSrc,
    };
  }

  private renderProfile(profile?: PrintableProfile) {
    if (!profile) {
      return '';
    }

    const waNumber = profile.phone ? profile.phone.replace(/\D/g, '') : '';
    const waLink = waNumber ? `https://wa.me/${waNumber}` : '';

    const detailRows: string[] = [];
    if (profile.ownerName) {
      detailRows.push(`<div class="detail-row"><span class="detail-icon">&#128100;</span><span>${escapeHtml(profile.ownerName)}</span></div>`);
    }
    if (profile.phone) {
      const waIcon = waLink
        ? `<a href="${waLink}" target="_blank" class="wa-link" title="Abrir WhatsApp">${whatsappSvg}</a>`
        : '';
      detailRows.push(`<div class="detail-row"><span class="detail-icon">&#128222;</span><span>${escapeHtml(profile.phone)}</span>${waIcon}</div>`);
    }
    if (profile.email) {
      detailRows.push(`<div class="detail-row"><span class="detail-icon">&#9993;</span><span>${escapeHtml(profile.email)}</span></div>`);
    }
    if (profile.address) {
      detailRows.push(`<div class="detail-row"><span class="detail-icon">&#128205;</span><span>${escapeHtml(profile.address)}</span></div>`);
    }
    if (profile.website) {
      detailRows.push(`<div class="detail-row"><span class="detail-icon">&#127760;</span><span>${escapeHtml(profile.website)}</span></div>`);
    }

    const transferRows: string[] = [];
    if (profile.ownerName) {
      transferRows.push(`<div class="transfer-row"><span>Titular</span><strong>${escapeHtml(profile.ownerName)}</strong></div>`);
    }
    if (profile.bankName) {
      transferRows.push(`<div class="transfer-row"><span>Banco</span><strong>${escapeHtml(profile.bankName)}</strong></div>`);
    }
    if (profile.bankAccountType) {
      transferRows.push(`<div class="transfer-row"><span>Tipo</span><strong>${escapeHtml(profile.bankAccountType)}</strong></div>`);
    }
    if (profile.bankAccountNumber) {
      transferRows.push(`<div class="transfer-row"><span>Nro. cuenta</span><strong>${escapeHtml(profile.bankAccountNumber)}</strong></div>`);
    }
    const transferHtml = transferRows.length > 0
      ? `<div class="transfer-box"><p class="transfer-title">Datos de transferencia</p><div class="transfer-grid">${transferRows.join('')}</div></div>`
      : '';

    return `<div class="brand"><div class="brand-row">${
      profile.pdfLogoSrc
        ? `<img src="${profile.pdfLogoSrc}" class="brand-logo" />`
        : '<div class="brand-logo brand-logo-placeholder">Logo</div>'
    }<div class="brand-info"><p class="brand-label">Catálogo generado por</p><h2>${escapeHtml(profile.businessName)}</h2></div></div>${
      detailRows.length > 0 ? `<div class="brand-details">${detailRows.join('')}</div>` : ''
    }${transferHtml}</div>`;
  }

  private renderProductCard(product: PrintableProduct, cardWidth: string, simpleList: boolean) {
    return `<article class="card" style="width:${cardWidth}">${
      product.pdfImageSrc
        ? `<div class="img-wrap"><img src="${product.pdfImageSrc}" alt="${escapeHtml(product.name)}" /></div>`
        : '<div class="img-wrap img-placeholder">Sin foto</div>'
    }<div class="info"><p class="pname">${escapeHtml(product.name)}</p><div class="${simpleList ? 'meta meta-list' : 'meta'}">${
      product.code ? `<p class="pcode">${escapeHtml(product.code)}</p>` : ''
    }<p class="pfmt">${escapeHtml(product.format)}</p></div><p class="pprice">${formatMoney(product.price)}</p></div></article>`;
  }

  private renderBody(
    input: PdfCatalogInput,
    productsForPdf: PrintableProduct[],
    profileHtml: string,
    headerHtml: string,
  ) {
    const layout = layoutFor(input.format);
    if (productsForPdf.length === 0) return '';

    const isPremium = input.format === 'premium-cover';
    const parts: string[] = [];

    if (isPremium) {
      const businessName = input.profile?.businessName ?? '';
      const coverLabel = input.purpose === 'purchase-detail' ? 'Detalle de compra' : 'Catálogo premium';
      parts.push(`<section class="page cover-page"><div class="cover-inner"><p class="cover-sub">${coverLabel}</p><h1 class="cover-title">${escapeHtml(input.catalogName)}</h1>${businessName ? `<p class="cover-business">${escapeHtml(businessName)}</p>` : ''}</div></section>`);
      parts.push('<div class="page-break"></div>');
    }

    const allRows = chunkProducts(productsForPdf, layout.columns);
    if (allRows.length === 0) return parts.join('');

    let rowIdx = 0;
    let isFirstPage = true;

    while (rowIdx < allRows.length) {
      const maxRows = isFirstPage ? layout.rowsFirstPage : layout.rowsPerPage;
      const endIdx = Math.min(rowIdx + maxRows, allRows.length);
      const chunk = allRows.slice(rowIdx, endIdx);

      const cardsPerRow = layout.columns;
      const gapMm = layout.compact ? 2 : 3;
      const cardWidth = `calc((100% - ${(cardsPerRow - 1) * gapMm}mm) / ${cardsPerRow})`;

      parts.push('<section class="page">');

      if (isFirstPage && (profileHtml || headerHtml)) {
        parts.push('<div class="first-page-header">');
        parts.push(profileHtml);
        parts.push(headerHtml);
        parts.push('</div>');
      } else if (!isFirstPage) {
        parts.push(`<header class="page-hdr"><h2>${escapeHtml(input.catalogName)}</h2><p>Productos</p></header>`);
      }

      for (const row of chunk) {
        const cards = row
          .map((p) => this.renderProductCard(p, cardWidth, input.format === 'simple-list'))
          .join('');
        parts.push(`<div class="row">${cards}</div>`);
      }

      parts.push('</section>');

      rowIdx = endIdx;
      isFirstPage = false;

      if (rowIdx < allRows.length) {
        parts.push('<div class="page-break"></div>');
      }
    }

    return parts.join('');
  }

  private buildHtml(
    input: PdfCatalogInput,
    productsForPdf: PrintableProduct[],
    profile: PrintableProfile | undefined,
  ) {
    if (input.format === 'premium-cover') {
      return buildEditorialCatalogHtml(input, productsForPdf, profile);
    }

    const layout = layoutFor(input.format);
    const compact = layout.compact;

    const profileHtml = this.renderProfile(profile);

    const isPurchaseDetail = input.purpose === 'purchase-detail';
    const productCount = input.products.length;
    const headerHtml = productCount > 0
      ? `<header class="cat-hdr"><h1>${escapeHtml(input.catalogName)}</h1><p>${isPurchaseDetail ? 'Detalle de compra' : `${productCount} producto${productCount !== 1 ? 's' : ''}`}</p></header>`
      : '';

    const body = this.renderBody(input, productsForPdf, profileHtml, headerHtml);

    const imgH = layout.imageHeightMm;
    const cardH = layout.cardHeightMm;
    const cardPad = compact ? 2 : 3;
    const nameSize = compact ? '9px' : '10.5px';
    const priceSize = compact ? '10px' : '12px';
    const codeSize = compact ? '7px' : '8px';
    const fmtSize = compact ? '6.5px' : '7.5px';
    const gap = compact ? 2 : 3;

    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
@page{size:A4;margin:10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:12px;line-height:1.2;background:#fff}

.page-break{page-break-after:always;break-after:page;height:0}
.page{page-break-inside:avoid;break-inside:avoid}

.cover-page{display:flex;align-items:center;justify-content:center;height:273mm;background:#111827;color:#fff}
.cover-inner{text-align:center}
.cover-sub{text-transform:uppercase;letter-spacing:3px;color:#93c5fd;font-size:13px;margin-bottom:10px}
.cover-title{font-size:42px;margin:0 0 8px}
.cover-business{font-size:16px;color:#dbeafe}

.first-page-header{margin-bottom:6mm}
.brand{border:1px solid #e5e7eb;border-radius:5px;padding:8px;margin-bottom:8px}
.brand-row{display:flex;align-items:center;gap:12px}
.brand-logo{border-radius:4px;height:40px;width:40px;object-fit:contain}
.brand-logo-placeholder{align-items:center;background:#dbeafe;color:#1d4ed8;display:flex;font-size:10px;font-weight:700;justify-content:center}
.brand-label{color:#2563eb;font-size:9px;font-weight:700;letter-spacing:1px;margin:0 0 2px;text-transform:uppercase}
.brand-info{flex:1}
.brand-info h2{font-size:18px;margin:0;font-weight:700}
.brand-details{border-top:1px solid #e5e7eb;display:flex;flex-wrap:wrap;gap:3px 12px;padding-top:4px;margin-top:4px}
.detail-row{display:flex;align-items:center;gap:4px;font-size:8.5px;color:#475569}
.detail-icon{font-size:11px;width:16px;text-align:center}
.wa-link{text-decoration:none;display:inline-flex;align-items:center}
.transfer-box{background:#f8fafc;border:1px solid #dbeafe;border-radius:4px;margin-top:5px;padding:5px}
.transfer-title{color:#1d4ed8;font-size:8px;font-weight:800;letter-spacing:.8px;margin-bottom:4px;text-transform:uppercase}
.transfer-grid{display:flex;flex-wrap:wrap;gap:3px 10px}
.transfer-row{display:flex;align-items:baseline;gap:4px;font-size:8px;color:#64748b;min-width:31%}
.transfer-row strong{color:#111827;font-size:8.5px}

.cat-hdr{border-bottom:2px solid #dbeafe;margin-bottom:6px;padding-bottom:6px}
.cat-hdr h1{margin:0;font-size:22px;font-weight:800;color:#111827}
.cat-hdr p{color:#64748b;margin:2px 0 0;font-size:11px}
.page-hdr{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid #e5e7eb;margin-bottom:4mm;padding-bottom:3mm}
.page-hdr h2{font-size:17px;font-weight:700;color:#111827}
.page-hdr p{color:#64748b;font-size:9px}

.row{display:flex;flex-wrap:nowrap;gap:${gap}mm;margin-bottom:${gap}mm;page-break-inside:avoid;break-inside:avoid}
.row:last-child{margin-bottom:0}

.card{height:${cardH}mm;border:1px solid #dbe3ef;border-radius:4px;padding:${cardPad}mm;page-break-inside:avoid;break-inside:avoid;overflow:hidden;flex-shrink:0;background:#fff;display:flex;flex-direction:column}
.img-wrap{width:100%;height:${imgH}mm;background:#f8fafc;border-radius:3px;border:1px solid #edf2f7;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.img-wrap img{width:100%;height:100%;object-fit:contain;object-position:center;display:block}
.img-placeholder{color:#1d4ed8;font-size:9px;font-weight:600}
.info{flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:0;overflow:hidden;padding-top:2mm}
.pname{font-size:${nameSize};font-weight:700;line-height:1.1;max-height:22px;overflow:hidden;word-break:break-word}
.meta{display:flex;align-items:center;gap:3px;min-height:8px}
.meta-list{gap:8px}
.pcode{font-size:${codeSize};color:#6b7280;font-weight:600}
.pfmt{font-size:${fmtSize};color:#6b7280;text-transform:uppercase;letter-spacing:.3px}
.pprice{font-size:${priceSize};font-weight:800;color:#2563eb;line-height:1.05}
</style></head><body>${body}</body></html>`;
  }
}
