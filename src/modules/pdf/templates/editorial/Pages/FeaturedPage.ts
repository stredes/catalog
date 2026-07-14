import { formatMoney } from '../../../../../shared/utils/money';
import { renderPageFrame } from '../Components/PageFrame';
import { escapeHtml } from '../utils/html';
import { EditorialProduct } from '../types';

export function renderFeaturedPage(pageNumber: number, product?: EditorialProduct) {
  const name = product?.name || 'Producto destacado';

  return renderPageFrame({
    title: 'Destacado',
    pageNumber,
    children: `<div class="feature-layout">
      ${
        product?.pdfImageSrc
          ? `<div class="feature-image"><img src="${product.pdfImageSrc}" alt="${escapeHtml(name)}" style="height:100%;object-fit:cover;width:100%" /></div>`
          : '<div class="feature-image placeholder-media"><span>Imagen destacada 16:9</span></div>'
      }
      <aside class="feature-copy">
        <p>Producto destacado</p>
        <h2>${escapeHtml(name)}</h2>
        <p>Bloque de informacion placeholder para comunicar atributos, usos recomendados y diferenciadores comerciales.</p>
        <ul class="feature-list">
          <li><span>Codigo</span><strong>${escapeHtml(product?.code || 'COD-000')}</strong></li>
          <li><span>Formato</span><strong>${escapeHtml(product?.format || 'unit')}</strong></li>
          <li><span>Precio</span><strong>${product ? formatMoney(product.price) : '$0'}</strong></li>
          <li><span>Disponibilidad</span><strong>${product && product.stock > 0 ? 'En stock' : 'A pedido'}</strong></li>
        </ul>
      </aside>
    </div>`,
  });
}

