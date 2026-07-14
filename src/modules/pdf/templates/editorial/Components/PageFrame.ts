import { escapeHtml } from '../utils/html';

type PageFrameOptions = {
  children: string;
  title?: string;
  pageNumber?: number;
  footerLabel?: string;
  className?: string;
};

export function renderPageFrame({
  children,
  title,
  pageNumber,
  footerLabel,
  className = '',
}: PageFrameOptions) {
  return `<section class="editorial-page ${className}">
    ${title ? `<header class="running-header"><span>${escapeHtml(title)}</span><span>Catalog Clean</span></header>` : ''}
    <main>${children}</main>
    ${
      pageNumber
        ? `<footer class="running-footer"><span>${escapeHtml(footerLabel || 'Catalogo editorial')}</span><span>${String(pageNumber).padStart(2, '0')}</span></footer>`
        : ''
    }
  </section>`;
}

