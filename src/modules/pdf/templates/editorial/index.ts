import { formatMoney } from '../../../../shared/utils/money';
import { PdfCatalogInput } from '../../domain/PdfGenerator';
import { renderEditorialStyles } from './Layouts/A4Layout';
import { EditorialFamily, EditorialPageSpec, EditorialProduct, EditorialProfile } from './types';
import { escapeHtml } from './utils/html';

function pageBreak() {
  return '<div class="page-break"></div>';
}

function clean(value?: string | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : '';
}

function safe(value?: string | null) {
  return escapeHtml(clean(value));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function imageBlock(src: string | null | undefined, alt: string, className: string, fit: 'cover' | 'contain' = 'cover') {
  if (!src) return `<div class="${className} placeholder-media"><span>Imagen</span></div>`;
  return `<div class="${className} image-${fit}"><img src="${src}" alt="${safe(alt)}" /></div>`;
}

function pageFrame(spec: EditorialPageSpec, pageNumber: number, catalogName: string, dark = false) {
  return `<section class="editorial-page ${dark ? 'products-dark' : ''}">
    <header class="running-header"><span>${String(pageNumber).padStart(2, '0')} / ${safe(spec.title)}</span><span>${safe(catalogName)}</span></header>
    <main>${spec.html}</main>
    <footer class="running-footer"><span>Catalog Clean Editorial Premium</span><span>${String(pageNumber).padStart(2, '0')}</span></footer>
  </section>`;
}

function productEditorial(input: PdfCatalogInput, productId: string) {
  return input.editorialContent?.products.find((item) => item.productId === productId);
}

function categoryEditorial(input: PdfCatalogInput, familyId: string) {
  return input.editorialContent?.categories.find((item) => item.familyId === familyId);
}

function productDescription(input: PdfCatalogInput, product: EditorialProduct) {
  return clean(productEditorial(input, product.id)?.description) ||
    'Descripcion editorial breve preparada para presentar el producto con claridad comercial.';
}

function productSpecs(input: PdfCatalogInput, product: EditorialProduct) {
  const editorial = productEditorial(input, product.id);
  const specs: [string, string][] = [
    ['Codigo', product.code || ''],
    ['Formato', product.format],
    ['Stock', product.stock > 0 ? `${product.stock}` : ''],
    ['Notas', clean(editorial?.specifications) || clean(editorial?.uses) || ''],
  ];

  return specs
    .filter(([, value]) => clean(value))
    .map(([label, value]) => `<div class="spec-row"><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`)
    .join('');
}

function heroProduct(products: EditorialProduct[]) {
  return products.find((product) => product.pdfImageSrc) ?? products[0];
}

function productsForFamily(products: EditorialProduct[], familyId: string) {
  return products.filter((product) => product.familyId === familyId);
}

function renderCover(input: PdfCatalogInput, products: EditorialProduct[], profile?: EditorialProfile) {
  const hero = heroProduct(products);
  const circle = products.find((product) => product.pdfImageSrc && product.id !== hero?.id) ?? hero;
  const businessName = clean(profile?.businessName) || 'Catalog Clean';
  const subtitle = clean(input.editorialContent?.section.subtitle) || 'Catalogo corporativo con diseno editorial premium.';
  const year = new Date().getFullYear();
  const contactRows = [profile?.phone, profile?.email, profile?.website].map(clean).filter(Boolean);

  return `<section class="editorial-page cover-page">
    <div class="cover-wrap">
      <div class="cover-left">
        <div class="brand-lockup">${safe(businessName)}</div>
        ${imageBlock(hero?.pdfImageSrc, hero?.name || input.catalogName, 'cover-photo', 'cover')}
        <div class="cover-contact">
          ${contactRows.length > 0 ? contactRows.map((row) => `<span>${safe(row)}</span>`).join('') : '<span>contacto@empresa.com</span><span>www.empresa.com</span>'}
        </div>
      </div>
      <div class="cover-right">
        <div>
          <p class="cover-kicker">Editorial Premium</p>
          <h1 class="cover-title">${safe(input.catalogName)}</h1>
        </div>
        <div>
          <p class="cover-subtitle">${safe(subtitle)}</p>
          ${imageBlock(circle?.pdfImageSrc, circle?.name || input.catalogName, 'cover-circle', 'cover')}
        </div>
        <div class="cover-season"><span>Temporada / Coleccion</span><strong>${year}</strong></div>
      </div>
    </div>
  </section>`;
}

function renderWelcome(input: PdfCatalogInput, tocItems: { title: string; page: number }[], products: EditorialProduct[]) {
  const intro = clean(input.editorialContent?.section.introduction) ||
    clean(input.editorialContent?.section.welcomeMessage) ||
    'Una seleccion curada de productos organizada como una publicacion editorial, lista para presentar y compartir.';
  const hero = heroProduct(products);

  return `<section class="editorial-page">
    <main class="welcome-layout">
      <div class="welcome-left">
        ${imageBlock(hero?.pdfImageSrc, hero?.name || input.catalogName, 'welcome-image', 'cover')}
        <div>
          <p class="chapter-label">Bienvenida</p>
          <h2 class="chapter-title">${safe(input.catalogName)}</h2>
          <p class="body-copy" style="margin-top:5mm">${safe(intro)}</p>
        </div>
      </div>
      <div class="welcome-right">
        <div>
          <p class="chapter-label">Indice</p>
          <div class="toc-list">
            ${tocItems.map((item, index) => `<div class="toc-row"><strong>${String(index + 1).padStart(2, '0')}</strong><span>${safe(item.title)}</span><em>${String(item.page).padStart(2, '0')}</em></div>`).join('')}
          </div>
        </div>
        <p class="quote">Catalogo generado offline, con composiciones editoriales adaptadas automaticamente.</p>
      </div>
    </main>
  </section>`;
}

function renderAboutSpec(input: PdfCatalogInput, products: EditorialProduct[], profile?: EditorialProfile): EditorialPageSpec | null {
  const about = input.editorialContent?.about;
  const businessName = clean(profile?.businessName) || 'Nuestra empresa';
  const text = clean(about?.description) || clean(about?.history) || clean(profile?.address);
  const hasProfileContent = Boolean(profile?.businessName || profile?.ownerName || profile?.website || text);
  if (!hasProfileContent) return null;

  const values = clean(about?.values)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  const hero = products.find((product) => product.pdfImageSrc);

  return {
    key: 'about',
    title: 'Sobre nosotros',
    includeInToc: true,
    html: `<div class="about-layout">
      <aside class="about-dark dark">
        <div>
          <p class="chapter-label">Perfil</p>
          <h2 class="chapter-title">${safe(businessName)}</h2>
        </div>
        <p class="quote">${safe(clean(about?.mission) || 'Diseno, claridad y confianza para cada presentacion comercial.')}</p>
      </aside>
      <div class="about-main">
        ${imageBlock(hero?.pdfImageSrc, hero?.name || businessName, 'about-image', 'cover')}
        <p class="body-copy">${safe(text || 'Texto institucional placeholder listo para personalizar con la historia, enfoque y propuesta de valor del negocio.')}</p>
        ${clean(about?.vision) ? `<p class="body-copy"><strong>Vision.</strong> ${safe(about?.vision)}</p>` : ''}
        <div class="values">${(values.length > 0 ? values : ['Calidad', 'Servicio', 'Confianza']).map((value) => `<span class="value-pill">${safe(value)}</span>`).join('')}</div>
      </div>
    </div>`,
  };
}

function renderCategoryOpening(input: PdfCatalogInput, family: EditorialFamily, products: EditorialProduct[], index: number): EditorialPageSpec {
  const description = clean(categoryEditorial(input, family.id)?.description) ||
    `Apertura editorial para la categoria ${family.name}, con una seleccion pensada para comparacion y compra rapida.`;
  const hero = products.find((product) => product.pdfImageSrc) ?? products[0];

  return {
    key: `category-${family.id}`,
    title: family.name,
    includeInToc: true,
    html: `<div class="category-open ${index % 2 === 1 ? 'reverse' : ''}">
      ${imageBlock(hero?.pdfImageSrc, hero?.name || family.name, 'category-photo', 'cover')}
      <div class="category-copy">
        <div>
          <p class="chapter-label">Categoria</p>
          <h2 class="chapter-title">${safe(family.name)}</h2>
          <p class="body-copy" style="margin-top:7mm">${safe(description)}</p>
        </div>
        <div>
          <div class="category-number">${String(index + 1).padStart(2, '0')}</div>
          <p class="category-count">${products.length} producto${products.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>`,
  };
}

function renderSixProducts(input: PdfCatalogInput, products: EditorialProduct[], key: string, title: string): EditorialPageSpec {
  return {
    key,
    title,
    includeInToc: false,
    html: `<div class="product-six">
      ${products.map((product) => `<article class="product-six-card">
        ${imageBlock(product.pdfImageSrc, product.name, 'product-six-media', 'contain')}
        <h3 class="product-name">${safe(product.name)}</h3>
        <p class="product-meta-line">${safe(product.code || product.format)}</p>
        <p class="product-price">${formatMoney(product.price)}</p>
      </article>`).join('')}
    </div>`,
  };
}

function renderFourProducts(input: PdfCatalogInput, products: EditorialProduct[], key: string, title: string): EditorialPageSpec {
  return {
    key,
    title,
    includeInToc: false,
    html: `<div class="product-four">
      ${products.map((product) => `<article class="product-four-card">
        ${imageBlock(product.pdfImageSrc, product.name, 'product-four-media', 'contain')}
        <div class="product-four-copy">
          <div>
            <h3 class="product-name">${safe(product.name)}</h3>
            <p class="body-copy">${safe(productDescription(input, product))}</p>
          </div>
          <div><p class="product-meta-line">${safe(product.code || product.format)}</p><p class="product-price">${formatMoney(product.price)}</p></div>
        </div>
      </article>`).join('')}
    </div>`,
  };
}

function renderFeaturePair(input: PdfCatalogInput, products: EditorialProduct[], key: string, title: string): EditorialPageSpec {
  return {
    key,
    title,
    includeInToc: false,
    html: `<div class="product-feature-layout">
      ${products.map((product) => `<article class="feature-card">
        ${imageBlock(product.pdfImageSrc, product.name, 'feature-media', 'contain')}
        <div class="feature-copy">
          <h3>${safe(product.name)}</h3>
          <p>${safe(productDescription(input, product))}</p>
          <p class="product-price">${formatMoney(product.price)}</p>
        </div>
      </article>`).join('')}
    </div>`,
  };
}

function renderPremiumProduct(input: PdfCatalogInput, product: EditorialProduct): EditorialPageSpec {
  const editorial = productEditorial(input, product.id);
  const quote = clean(editorial?.quote) || clean(editorial?.highlights) || 'Producto destacado de la seleccion.';

  return {
    key: `premium-${product.id}`,
    title: 'Producto premium',
    includeInToc: true,
    html: `<div class="premium-product">
      ${imageBlock(product.pdfImageSrc, product.name, 'premium-media', 'contain')}
      <div class="premium-copy">
        <p class="chapter-label">Producto premium</p>
        <h2>${safe(product.name)}</h2>
        <p class="body-copy" style="margin-top:6mm">${safe(productDescription(input, product))}</p>
        <p class="quote" style="margin-top:7mm">${safe(quote)}</p>
        <div class="spec-list">${productSpecs(input, product)}</div>
      </div>
    </div>`,
  };
}

function renderProductSpecs(input: PdfCatalogInput, products: EditorialProduct[], family: EditorialFamily): EditorialPageSpec[] {
  const pages: EditorialPageSpec[] = [];
  const familyTitle = `Productos / ${family.name}`;
  const all = [...products];

  if (all.length === 0) return pages;
  if (all[0]) pages.push(renderPremiumProduct(input, all[0]));

  const rest = all.slice(1);
  let layoutIndex = 0;
  let cursor = 0;
  while (cursor < rest.length) {
    if (rest.length - cursor <= 2) {
      const group = rest.slice(cursor, cursor + 2);
      pages.push(renderFeaturePair(input, group, `${family.id}-feature-${cursor}`, familyTitle));
      cursor += group.length;
    } else if (layoutIndex % 2 === 0) {
      const group = rest.slice(cursor, cursor + 6);
      pages.push(renderSixProducts(input, group, `${family.id}-six-${cursor}`, familyTitle));
      cursor += group.length;
    } else {
      const group = rest.slice(cursor, cursor + 4);
      pages.push(renderFourProducts(input, group, `${family.id}-four-${cursor}`, familyTitle));
      cursor += group.length;
    }
    layoutIndex += 1;
  }

  return pages;
}

function renderGallerySpec(products: EditorialProduct[]): EditorialPageSpec | null {
  const images = products.filter((product) => product.pdfImageSrc).slice(0, 4);
  if (images.length < 2) return null;

  return {
    key: 'gallery',
    title: 'Galeria',
    includeInToc: true,
    html: `<div class="gallery-layout">
      ${imageBlock(images[0].pdfImageSrc, images[0].name, 'gallery-dominant', 'cover')}
      <div class="gallery-stack">
        ${images.slice(1, 4).map((product) => imageBlock(product.pdfImageSrc, product.name, 'gallery-small', 'cover')).join('')}
        <p class="gallery-caption">Seleccion visual de la coleccion</p>
      </div>
    </div>`,
  };
}

function renderComparisonSpec(products: EditorialProduct[]): EditorialPageSpec | null {
  if (products.length < 2) return null;
  return {
    key: 'comparison',
    title: 'Comparativa',
    includeInToc: true,
    html: `<div>
      <p class="chapter-label">Comparativa</p>
      <h2 class="chapter-title">Lectura rapida</h2>
      <div class="comparison-list" style="margin-top:9mm">
        ${products.slice(0, 6).map((product) => `<article class="comparison-item">
          ${imageBlock(product.pdfImageSrc, product.name, 'comparison-thumb', 'contain')}
          <div class="comparison-copy">
            <h3 class="product-name">${safe(product.name)}</h3>
            <p class="product-meta-line">${safe(product.code || 'Codigo pendiente')} / ${safe(product.format)}</p>
          </div>
          <strong class="comparison-price">${formatMoney(product.price)}</strong>
        </article>`).join('')}
      </div>
    </div>`,
  };
}

function renderContact(input: PdfCatalogInput, profile?: EditorialProfile): EditorialPageSpec {
  const businessName = clean(profile?.businessName) || 'Catalog Clean';
  const rows = [profile?.ownerName, profile?.phone, profile?.email, profile?.website, profile?.address]
    .map(clean)
    .filter(Boolean);

  return {
    key: 'contact',
    title: 'Contacto',
    includeInToc: true,
    html: `<div class="contact-layout">
      <div class="contact-dark dark">
        <div>
          <p class="chapter-label">Contacto</p>
          <h2 class="chapter-title">${safe(businessName)}</h2>
        </div>
        <p class="quote">${safe(clean(input.editorialContent?.section.welcomeMessage) || 'Gracias por revisar esta seleccion editorial.')}</p>
      </div>
      <div class="contact-light">
        <div class="contact-list">
          ${(rows.length > 0 ? rows : ['contacto@empresa.com', 'www.empresa.com']).map((row) => `<p>${safe(row)}</p>`).join('')}
        </div>
        <div class="qr-box">Codigo QR</div>
      </div>
    </div>`,
  };
}

function contentSpecs(input: PdfCatalogInput, products: EditorialProduct[], profile?: EditorialProfile) {
  const specs: EditorialPageSpec[] = [];
  const families = input.families.length > 0
    ? input.families
    : [{ id: 'all', name: 'Coleccion', createdAt: '', updatedAt: '' }];

  const about = renderAboutSpec(input, products, profile);
  if (about) specs.push(about);

  families.forEach((family, index) => {
    const familyProducts = productsForFamily(products, family.id);
    const scopedProducts = familyProducts.length > 0 ? familyProducts : products;
    if (scopedProducts.length === 0) return;
    specs.push(renderCategoryOpening(input, family, scopedProducts, index));
    specs.push(...renderProductSpecs(input, scopedProducts, family));
  });

  const gallery = renderGallerySpec(products);
  if (gallery) specs.push(gallery);

  const comparison = renderComparisonSpec(products);
  if (comparison) specs.push(comparison);

  specs.push(renderContact(input, profile));
  return specs;
}

export function buildEditorialCatalogHtml(
  input: PdfCatalogInput,
  products: EditorialProduct[],
  profile?: EditorialProfile,
) {
  const specs = contentSpecs(input, products, profile);
  const tocItems = specs
    .map((spec, index) => ({ title: spec.title, page: index + 3, includeInToc: spec.includeInToc }))
    .filter((item) => item.includeInToc);

  const pages = [
    renderCover(input, products, profile),
    renderWelcome(input, tocItems, products),
    ...specs.map((spec, index) => pageFrame(spec, index + 3, input.catalogName, spec.key.includes('-six-'))),
  ];

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />${renderEditorialStyles()}</head><body>${pages.join(pageBreak())}</body></html>`;
}

