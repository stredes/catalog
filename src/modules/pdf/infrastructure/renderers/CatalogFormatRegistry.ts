import { CatalogFormat } from '../../../catalogs/domain/entities/Catalog';
import { CatalogRenderer } from '../../domain/CatalogRenderer';
import { StandardGridCatalogRenderer } from './StandardGridCatalogRenderer';
import { PremiumEditorialCatalogRenderer } from './PremiumEditorialCatalogRenderer';

type FormatConfig = {
  renderer: CatalogRenderer;
  maxDimension: number;
};

const STANDARD_FORMATS: CatalogFormat[] = [
  'grid-2',
  'grid-3',
  'grid-4x5',
  'grid-3x7',
  'simple-list',
];

const registry = new Map<CatalogFormat, FormatConfig>();

function register(format: CatalogFormat, renderer: CatalogRenderer, maxDimension: number) {
  registry.set(format, { renderer, maxDimension });
}

function init() {
  const standardRenderer = new StandardGridCatalogRenderer();
  const premiumRenderer = new PremiumEditorialCatalogRenderer();

  for (const format of STANDARD_FORMATS) {
    register(format, standardRenderer, format === 'grid-4x5' || format === 'grid-3x7' ? 300 : 480);
  }

  register('premium-cover', premiumRenderer, 480);
}

init();

export function getCatalogRenderer(format: CatalogFormat): CatalogRenderer {
  const entry = registry.get(format);
  if (!entry) {
    const fallback = registry.get('grid-2');
    if (!fallback) {
      throw new Error(`No renderer registered for format: ${format}`);
    }
    return fallback.renderer;
  }
  return entry.renderer;
}

export function getMaxDimension(format: CatalogFormat): number {
  const entry = registry.get(format);
  return entry?.maxDimension ?? 480;
}

export function registerCatalogFormat(format: CatalogFormat, renderer: CatalogRenderer, maxDimension = 480) {
  register(format, renderer, maxDimension);
}
