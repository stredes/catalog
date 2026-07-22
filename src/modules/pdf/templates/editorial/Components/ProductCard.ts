import { formatMoney } from '../../../../../shared/utils/money';
import { escapeHtml } from '../utils/html';
import { EditorialProduct } from '../types';

export function renderEditorialProductCard(product: EditorialProduct, tone: 'light' | 'compact' = 'light') {
  const features = [
    product.format,
    product.stock > 0 ? `Stock ${product.stock}` : '',
    product.code ? `Codigo ${product.code}` : '',
  ].filter(Boolean);

  return `<article class="product-card product-card-${tone}">
    ${
      product.pdfImageSrc
        ? `<div class="product-media"><img src="${product.pdfImageSrc}" alt="${escapeHtml(product.name)}" /></div>`
        : '<div class="product-media placeholder-media"><span>Imagen 1:1</span></div>'
    }
    <div class="product-copy">
      <div>
        <p class="product-code">${escapeHtml(product.code || 'COD-000')}</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-description">Descripcion corta del producto, pensada para catalogos comerciales.</p>
      </div>
      <ul>${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>
      <div class="product-meta">
        <strong>${formatMoney(product.price)}</strong>
        <span>Disponible</span>
      </div>
    </div>
  </article>`;
}

