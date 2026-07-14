import { renderPageFrame } from '../Components/PageFrame';
import { renderSectionHeader } from '../Components/SectionHeader';

export function renderTableOfContentsPage(pageNumber: number) {
  const rows = [
    ['01', 'Sobre nosotros', '03'],
    ['02', 'Categorias', '04'],
    ['03', 'Producto destacado', '06'],
    ['04', 'Comparativa', '07'],
    ['05', 'Galeria', '08'],
    ['06', 'Contacto', '10'],
  ];

  return renderPageFrame({
    title: 'Contenido',
    pageNumber,
    children: `${renderSectionHeader('Indice', 'Tabla de contenidos', 'Estructura lista para personalizar.')}
      <div class="toc-list">
        ${rows.map(([index, label, page]) => `<div class="toc-row"><strong>${index}</strong><span>${label}</span><em>${page}</em></div>`).join('')}
      </div>`,
  });
}

