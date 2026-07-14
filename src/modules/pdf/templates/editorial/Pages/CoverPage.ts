import { escapeHtml } from '../utils/html';
import { EditorialProduct, EditorialProfile } from '../types';

export function renderCoverPage(
  catalogName: string,
  products: EditorialProduct[],
  profile?: EditorialProfile,
) {
  const hero = products.find((product) => product.pdfImageSrc);
  const businessName = profile?.businessName || 'Marca';
  const currentYear = new Date().getFullYear();

  return `<section class="editorial-page cover-page">
    <div class="cover-grid">
      <div class="cover-logo">${escapeHtml(businessName)}</div>
      <div class="cover-title">
        <h1>${escapeHtml(catalogName || 'Catalogo de productos')}</h1>
        <p>Plantilla editorial premium para presentar colecciones, productos y servicios.</p>
      </div>
      ${
        hero?.pdfImageSrc
          ? `<div class="cover-hero"><img src="${hero.pdfImageSrc}" alt="${escapeHtml(hero.name)}" /></div>`
          : '<div class="cover-hero placeholder-media"><span>Imagen principal 4:5</span></div>'
      }
      <div class="cover-year">${currentYear}</div>
      <div class="cover-meta">
        <span>A4 vertical</span>
        <span>Grid editorial de 12 columnas</span>
        <span>${products.length} productos seleccionados</span>
      </div>
    </div>
  </section>`;
}

