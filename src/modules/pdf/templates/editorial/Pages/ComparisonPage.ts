import { formatMoney } from '../../../../../shared/utils/money';
import { renderPageFrame } from '../Components/PageFrame';
import { renderSectionHeader } from '../Components/SectionHeader';
import { escapeHtml } from '../utils/html';
import { EditorialProduct } from '../types';

export function renderComparisonPage(pageNumber: number, products: EditorialProduct[]) {
  const rows = products.slice(0, 5);

  return renderPageFrame({
    title: 'Comparativa',
    pageNumber,
    children: `${renderSectionHeader('Comparativa', 'Tabla limpia', 'Columnas alineadas para evaluar productos.')}
      <table class="compare-table">
        <thead><tr><th>Producto</th><th>Codigo</th><th>Formato</th><th>Precio</th><th>Estado</th></tr></thead>
        <tbody>
          ${
            rows.length > 0
              ? rows.map((product) => `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.code || 'COD-000')}</td><td>${escapeHtml(product.format)}</td><td>${formatMoney(product.price)}</td><td><span class="icon-dot"></span></td></tr>`).join('')
              : '<tr><td>Producto placeholder</td><td>COD-000</td><td>unit</td><td>$0</td><td><span class="icon-dot"></span></td></tr>'
          }
        </tbody>
      </table>`,
  });
}

