import { Product } from '../../../products/domain/entities/product';
import { Family } from '../../../families/domain/entities/Family';

function h(str: string): number {
  let v = 0;
  for (let i = 0; i < str.length; i++) {
    v = ((v << 5) - v + str.charCodeAt(i)) | 0;
  }
  return Math.abs(v);
}

function pick<T>(arr: T[], seed: string): T {
  return arr[h(seed) % arr.length];
}

function pickN<T>(arr: T[], seed: string, n: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  let s = seed;
  for (let i = 0; i < n && i < arr.length; i++) {
    let idx = h(s) % arr.length;
    while (used.has(idx)) idx = (idx + 1) % arr.length;
    used.add(idx);
    result.push(arr[idx]);
    s = s + idx;
  }
  return result;
}

const FORMAT_LABELS: Record<string, string> = {
  unit: 'unidad', box: 'caja', pack: 'paquete', service: 'servicio',
};

const FORMAT_ADJ: Record<string, string[]> = {
  unit: ['versátil', 'práctico', 'eficiente', 'confiable', 'premium', 'robusto', 'ligero', 'compacto'],
  box: ['completo', 'generoso', 'abundante', 'integral', 'profesional', 'amplio', 'robusto', 'versátil'],
  pack: ['conveniente', 'económico', 'smart', 'estratégico', 'práctico', 'eficiente', 'rentable', 'selecto'],
  service: ['personalizado', 'especializado', 'profesional', 'dedicado', 'experto', 'certificado', 'privilegiado', 'exclusivo'],
};

const QUALITY_WORDS = [
  'excelencia', 'calidad superior', 'alto estándar', 'excelencia comprobada',
  'calidad premium', 'estándar premium', 'riguroso control de calidad',
];

const NOW = new Date();

// ─── Catalog Section ──────────────────────────────────

const CATALOG_TITLE = [
  (f: string) => `Catálogo ${f} — Edición ${NOW.getFullYear()}`,
  (f: string) => `${f} — Selección Especial`,
  (f: string) => `Guía de Productos ${f}`,
  (f: string) => `${f} — Colección Profesional`,
  (f: string) => `Catálogo Premium ${f}`,
  (f: string) => `${f} — Edición Exclusiva`,
  (f: string) => `Selección ${f} ${NOW.getFullYear()}`,
  (f: string) => `${f} — Catálogo Integral`,
];

const CATALOG_SUBTITLE = [
  (f: string) => `Productos seleccionados del sector ${f.toLowerCase()}`,
  (f: string) => `Lo mejor en ${f.toLowerCase()} para tu negocio`,
  (f: string) => `Soluciones profesionales en ${f.toLowerCase()}`,
  (f: string) => `Catálogo actualizado de ${f.toLowerCase()}`,
  (f: string) => `Ofera exclusiva en ${f.toLowerCase()}`,
  (f: string) => `Productos destacados en ${f.toLowerCase()}`,
];

const CATALOG_WELCOME = [
  (n: string, c: number) => `Te damos la bienvenida a ${n}. En este catálogo encontrarás una selección cuidadosamente elegida de ${c} productos diseñados para superar tus expectativas.`,
  (n: string, c: number) => `Bienvenido a ${n}. Hemos reunido ${c} productos seleccionados para ofrecerte las mejores opciones del mercado.`,
  (n: string, c: number) => `${n} te presenta una colección exclusiva de ${c} productos. Cada uno ha sido evaluado para garantizar la más alta calidad.`,
  (n: string, c: number) => `Explora ${n}, donde ${c} productos te esperan. Una selección pensada para profesionales que exigen resultados.`,
  (n: string, c: number) => `En ${n} nos enorgullece presentarte ${c} opciones cuidadosamente seleccionadas para tu negocio.`,
];

const CATALOG_INTRO = [
  (c: number, fs: string) => `Nuestro catálogo reúne ${c} productos de las categorías ${fs}, cada uno respaldado por un compromiso inquebrantable con la calidad y la innovación.`,
  (c: number, fs: string) => `A lo largo de estas páginas descubrirás ${c} productos provenientes de ${fs}. Cada pieza ha sido seleccionada por su rendimiento, durabilidad y valor.`,
  (c: number, fs: string) => `Este catálogo abarca ${c} productos distribuidos en ${fs}. Una colección que refleja los más altos estándares de la industria.`,
  (c: number, fs: string) => `Con ${c} productos de ${fs}, este catálogo está diseñado para ser tu guía de referencia. Contenido actualizado y verificado.`,
];

// ─── About Us ─────────────────────────────────────────

const ABOUT_DESC = [
  (b: string) => `${b} es una empresa comprometida con la excelencia, dedicada a ofrecer productos y servicios que superan las expectativas de sus clientes desde el primer contacto.`,
  (b: string) => `En ${b} creemos que la calidad no es negociable. Por eso, cada producto que ofrecemos pasa por rigurosos controles para garantizar resultados excepcionales.`,
  (b: string) => `${b} se distingue por su enfoque en el cliente, combinando innovación constante con un servicio personalizado que genera valor real.`,
  (b: string) => `Somos ${b}: una empresa que fusiona experiencia del sector con una visión moderna del negocio. Nuestro compromiso es tu satisfacción.`,
];

const ABOUT_HISTORY = [
  (b: string) => `${b} nació con la visión de transformar la experiencia de compra en el sector. Desde nuestros inicios, nos hemos enfocado en construir relaciones sólidas basadas en la confianza y la transparencia.`,
  (b: string) => `La historia de ${b} comenzó con un objetivo claro: ofrecer una alternativa superior en el mercado. Cada año hemos fortalecido nuestra posición a través de la mejora continua.`,
  (b: string) => `Desde su fundación, ${b} ha recorrido un camino de crecimiento sostenido, impulsado por la pasión por hacer las cosas bien y la disciplina de superar estándares.`,
];

const ABOUT_MISSION = [
  (b: string) => `Nuestra misión en ${b} es proveer soluciones de alta calidad que potencien el crecimiento de nuestros clientes, brindando un servicio excepcional y productos que generan confianza.`,
  (b: string) => `En ${b} nos dedicamos a ofrecer productos y servicios que marcan la diferencia. Trabajamos cada día para que nuestros clientes obtengan resultados superiores.`,
  (b: string) => `La misión de ${b} es clara: ser el aliado estratégico que impulsa el éxito de cada cliente a través de soluciones confiables y de alto rendimiento.`,
];

const ABOUT_VISION = [
  (b: string) => `Aspiramos a ser referentes del sector, reconocidos por la innovación, la calidad de nuestro catálogo y la satisfacción de quienes confían en ${b}.`,
  (b: string) => `Nuestra visión es consolidar a ${b} como líder en soluciones profesionales, expandiendo constantemente nuestra oferta para anticiparnos a las necesidades del mercado.`,
  (b: string) => `En ${b} vemos un futuro donde la excelencia operativa y la atención personalizada nos definen. Buscamos ser el estándar de calidad en todo lo que hacemos.`,
];

const ABOUT_VALUES = [
  () => `• Integridad en cada transacción\n• Compromiso con la calidad\n• Innovación constante\n• Respeto por el cliente\n• Mejora continua`,
  () => `• Excelencia operativa\n• Transparencia total\n• Orientación al resultado\n• Pasión por servir\n• Responsabilidad ambiental`,
  () => `• Calidad sin compromisos\n• Confianza y profesionalismo\n• Creatividad aplicada\n• Trabajo en equipo\n• Sostenibilidad`,
];

// ─── Categories ───────────────────────────────────────

const CATEGORY_DESC = [
  (fn: string, c: number) => `Nuestra línea de ${fn} reúne ${c} productos seleccionados para ofrecerte opciones confiables y de alto rendimiento en cada compra.`,
  (fn: string, c: number) => `En la categoría ${fn} encontrarás ${c} alternativas cuidadosamente evaluadas para garantizar calidad, durabilidad y valor excepcional.`,
  (fn: string, c: number) => `${fn} comprende ${c} productos que destacan por su diseño funcional, materiales de primera y prestaciones superiores.`,
  (fn: string, c: number) => `Explora ${fn}: ${c} productos seleccionados que combinan innovación, practicidad y los más altos estándares de la industria.`,
  (fn: string, c: number) => `La categoría ${fn} ofrece ${c} soluciones profesionales diseñadas para satisfacer las exigencias más-demandantes del mercado.`,
  (fn: string, c: number) => `Descubrí ${fn}, una selección de ${c} productos que representan lo mejor en su segmento. Calidad garantizada.`,
];

// ─── Products ─────────────────────────────────────────

const PROD_DESC = [
  (n: string, f: string) => `El ${n} es la combinación ideal de calidad y diseño. Su formato de ${FORMAT_LABELS[f]} lo convierte en una opción ${pick(FORMAT_ADJ[f], n)} para profesionales exigentes.`,
  (n: string, f: string) => `${n} representa la excelencia en su categoría. Fabricado con estándares rigurosos, su presentación en ${FORMAT_LABELS[f]} ofrece practicidad y resultados superiores.`,
  (n: string, f: string) => `Descubrí ${n}: un producto ${pick(FORMAT_ADJ[f], n)} que eleva el estándar de calidad en su segmento. Ideal para quienes priorizan el rendimiento.`,
  (n: string, f: string) => `Con un diseño pensado para el uso profesional, ${n} destacó por su ${pick(FORMAT_ADJ[f], n)} desempeño y su formato ${FORMAT_LABELS[f]} optimizado.`,
  (n: string, f: string) => `${n} ha sido diseñado para ofrecer el máximo rendimiento. Su formato de ${FORMAT_LABELS[f]} garantiza una experiencia de uso ${pick(FORMAT_ADJ[f], n)} y eficiente.`,
  (n: string, f: string) => `El ${n} combina materiales de primera con un acabado impecable. Su presentación en ${FORMAT_LABELS[f]} lo hace ${pick(FORMAT_ADJ[f], n)} y funcional.`,
  (n: string, f: string) => `Profesionales eligen ${n} por su consistencia y confiabilidad. Un producto ${pick(FORMAT_ADJ[f], n)} que cumple con las más altas expectativas.`,
  (n: string, f: string) => `${n} se posiciona como una referencia en su campo. Su formato ${FORMAT_LABELS[f]} y calidad constructiva lo hacen indispensable.`,
];

const PROD_BENEFITS = [
  () => `• Calidad verificada en cada pieza\n• Relación precio-rendimiento superior\n• Disponibilidad inmediata\n• Soporte técnico especializado\n• Garantía de satisfacción`,
  () => `• Diseño funcional y duradero\n• Fácil mantenimiento y limpieza\n• Resultados consistentes\n• Inversión inteligente a largo plazo\n• Elaboración con estándares certificados`,
  () => `• Materiales de origen confiable\n• Rendimiento superior demostrado\n• Versatilidad en su aplicación\n• Stock siempre disponible\n• Precio competitivo del mercado`,
  () => `• Construcción robusta y confiable\n• Optimizado para el uso frecuente\n• Cumple normativas de calidad\n• Entrega rápida y segura\n• Alternativa profesional de referencia`,
  () => `• Garantía extendida incluida\n• Fabricación con tecnología avanzada\n• Compatible con líneas estándar\n• Diseño ergonómico y práctico\n• Aprobado por profesionales del sector`,
];

const PROD_HIGHLIGHTS = [
  () => `• Acabado premium de alta resistencia\n• Fabricación con tecnología de vanguardia\n• Diseño reconocido por su elegancia funcional\n• Certificaciones de calidad internacionales`,
  () => `• Componentes seleccionados manualmente\n• Proceso de fabricación certificado\n• Acabados que resisten el uso intensivo\n• Diseño galardonado por su innovación`,
  () => `• Estructura reforzada para máxima durabilidad\n• Superficies tratadas con protección avanzada\n• Dimensión optimizada para versatilidad\n• Estética contemporánea y profesional`,
  () => `• Materiales de origen responsable\n• Ingeniería de precisión en cada detalle\n• Acabado que combina estética y función\n• Referencia de diseño en su categoría`,
];

const PROD_USES = [
  (fn: string) => `Ideal para uso comercial y profesional en el sector ${fn.toLowerCase()}. Perfecto para proyectos que requieren consistencia y confiabilidad.`,
  (fn: string) => `Aplicable en entornos ${fn.toLowerCase()} profesionales, comerciales e industriales. Versátil y adaptable a diversas necesidades operativas.`,
  (fn: string) => `Diseñado para integrarse fluidamente en operaciones de ${fn.toLowerCase()}. Su uso se extiende tanto al ámbito profesional como residencial.`,
  (fn: string) => `Recomendado para profesionales del sector ${fn.toLowerCase()} que buscan soluciones confiables con resultados comprobables.`,
  (fn: string) => `Excelente opción para renovación, nuevos emprendimientos y proyectos de expansión en el área de ${fn.toLowerCase()}.`,
];

const PROD_SPECS = [
  (p: Product, fn: string) => `Categoría: ${fn}\nFormato: ${FORMAT_LABELS[p.format]}\nCódigo: ${p.code || '—'}\nPrecio unitario: $${p.price.toLocaleString('es-CL')}`,
  (p: Product, fn: string) => `Línea: ${fn}\nPresentación: ${FORMAT_LABELS[p.format]}\nReferencia: ${p.code || '—'}\nInversión: $${p.price.toLocaleString('es-CL')}`,
];

const PROD_QUOTES = [
  (n: string) => `La calidad que necesitás, el valor que merecés.`,
  (n: string) => `Diseñado para durar, pensado para destacar.`,
  (n: string) => `Donde la funcionalidad encuentra la excelencia.`,
  (n: string) => `Superando expectativas, una pieza a la vez.`,
  (n: string) => `Innovación que se nota en cada detalle.`,
  (n: string) => `El estándar que tu negocio merece.`,
  (n: string) => `Calidad que habla por sí misma.`,
  (n: string) => `Más que un producto, una garantía.`,
  (n: string) => `Rendimiento profesional, resultado excepcional.`,
  (n: string) => `Tu próxima referencia en calidad.`,
];

export class ContentGenerator {
  generateCatalogTitle(familyName: string): string {
    return pick(CATALOG_TITLE, familyName)(familyName);
  }

  generateCatalogSubtitle(familyName: string): string {
    return pick(CATALOG_SUBTITLE, familyName)(familyName);
  }

  generateCatalogWelcome(name: string, productCount: number): string {
    return pick(CATALOG_WELCOME, name)(name, productCount);
  }

  generateCatalogIntroduction(name: string, families: Family[]): string {
    const familyNames = families.map((f) => f.name).join(', ');
    return pick(CATALOG_INTRO, name)(families.length > 3 ? 3 : families.length, familyNames);
  }

  generateAboutDescription(businessName: string): string {
    return pick(ABOUT_DESC, businessName)(businessName);
  }

  generateAboutHistory(businessName: string): string {
    return pick(ABOUT_HISTORY, businessName)(businessName);
  }

  generateAboutMission(businessName: string): string {
    return pick(ABOUT_MISSION, businessName)(businessName);
  }

  generateAboutVision(businessName: string): string {
    return pick(ABOUT_VISION, businessName)(businessName);
  }

  generateAboutValues(businessName: string): string {
    return pick(ABOUT_VALUES, businessName)();
  }

  generateCategoryDescription(familyName: string, productCount: number): string {
    return pick(CATEGORY_DESC, familyName)(familyName, productCount);
  }

  generateProductDescription(product: Product, familyName: string): string {
    return pick(PROD_DESC, product.id)(product.name, product.format);
  }

  generateProductBenefits(product: Product, _familyName: string): string {
    return pick(PROD_BENEFITS, product.id)();
  }

  generateProductHighlights(product: Product, _familyName: string): string {
    return pick(PROD_HIGHLIGHTS, product.id)();
  }

  generateProductUses(product: Product, familyName: string): string {
    return pick(PROD_USES, product.id)(familyName);
  }

  generateProductSpecifications(product: Product, familyName: string): string {
    return pick(PROD_SPECS, product.id)(product, familyName);
  }

  generateProductQuote(product: Product, _familyName: string): string {
    return pick(PROD_QUOTES, product.id)(product.name);
  }
}
