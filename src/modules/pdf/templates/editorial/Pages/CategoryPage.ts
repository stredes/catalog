import { renderEditorialProductCard } from '../Components/ProductCard';
import { renderPageFrame } from '../Components/PageFrame';
import { renderSectionHeader } from '../Components/SectionHeader';
import { escapeHtml } from '../utils/html';
import { EditorialFamily, EditorialProduct } from '../types';

export function renderCategoryPage(
  pageNumber: number,
  family: EditorialFamily,
  products: EditorialProduct[],
) {
  const visibleProducts = products.slice(0, 4);

  return renderPageFrame({
    title: family.name,
    pageNumber,
    children: `${renderSectionHeader('Categoria', family.name, 'Descripcion corta de la coleccion y sus beneficios principales.')}
      <div class="category-grid">
        ${
          visibleProducts.length > 0
            ? visibleProducts.map((product) => renderEditorialProductCard(product)).join('')
            : `<div class="placeholder-media" style="height:90mm;grid-column:1/3"><span>${escapeHtml('Productos placeholder')}</span></div>`
        }
      </div>`,
  });
}

