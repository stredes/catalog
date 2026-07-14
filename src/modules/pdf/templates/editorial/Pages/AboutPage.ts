import { renderPageFrame } from '../Components/PageFrame';
import { renderSectionHeader } from '../Components/SectionHeader';
import { escapeHtml } from '../utils/html';
import { EditorialProduct, EditorialProfile } from '../types';

export function renderAboutPage(pageNumber: number, profile?: EditorialProfile, products: EditorialProduct[] = []) {
  const image = products.find((product) => product.pdfImageSrc);
  const businessName = profile?.businessName || 'Nuestra empresa';
  const copy = 'Texto placeholder para presentar la historia, propuesta de valor, procesos, cobertura comercial y criterios de calidad de la marca. Este bloque esta preparado para reemplazarse por contenido real sin alterar la reticula ni los margenes del documento.';

  return renderPageFrame({
    title: 'Sobre nosotros',
    pageNumber,
    children: `${renderSectionHeader('Perfil', businessName, 'Una pagina institucional limpia y flexible.')}
      <div class="two-column">
        <div class="copy-columns">
          <p>${escapeHtml(copy)}</p>
          <p>${escapeHtml(copy)}</p>
          <p>${escapeHtml(copy)}</p>
          <p>${escapeHtml(copy)}</p>
        </div>
        ${
          image?.pdfImageSrc
            ? `<div class="side-image"><img src="${image.pdfImageSrc}" alt="${escapeHtml(image.name)}" style="height:100%;object-fit:cover;width:100%" /></div>`
            : '<div class="side-image placeholder-media"><span>Imagen lateral 4:5</span></div>'
        }
      </div>`,
  });
}

