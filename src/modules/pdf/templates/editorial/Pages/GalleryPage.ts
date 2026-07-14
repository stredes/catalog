import { renderPageFrame } from '../Components/PageFrame';
import { renderSectionHeader } from '../Components/SectionHeader';
import { escapeHtml } from '../utils/html';
import { EditorialProduct } from '../types';

export function renderGalleryPage(pageNumber: number, products: EditorialProduct[]) {
  const items = products.slice(0, 9);

  return renderPageFrame({
    title: 'Galeria',
    pageNumber,
    children: `${renderSectionHeader('Galeria', 'Vista uniforme', 'Imagenes en formato 4:5 con espacios constantes.')}
      <div class="gallery-grid">
        ${
          items.length > 0
            ? items.map((product) => product.pdfImageSrc
              ? `<div class="gallery-item"><img src="${product.pdfImageSrc}" alt="${escapeHtml(product.name)}" /></div>`
              : '<div class="gallery-item placeholder-media"><span>4:5</span></div>').join('')
            : Array.from({ length: 9 }, () => '<div class="gallery-item placeholder-media"><span>4:5</span></div>').join('')
        }
      </div>`,
  });
}

