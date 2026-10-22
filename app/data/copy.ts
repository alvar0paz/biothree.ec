// Central place for shared Spanish copy and asset paths.
// Match every claim to evidence for the specific preparation. Softer verbs alone
// do not substantiate a benefit. Keep dosing tied to the current Ecuador label.

// Social/contact links and fallback when Shopify product data is unavailable.
export const INSTAGRAM_URL = 'https://instagram.com/biothree.ec';

// Current commercial operator; import arrangements are described separately.
export const COMMERCIAL_COMPANY = {
  name: 'Biostradeglobal',
  url: 'https://biostradeglobal.com',
} as const;

// Assets live in app/assets/biothree and are bundled through Vite, so they get
// hashed/cached URLs. Import them here once and reference via ASSETS everywhere.
import probioticChain from '~/assets/biothree/probiotic-chain.png';
import probioticRods from '~/assets/biothree/probiotic-rods.png';
import probioticCells from '~/assets/biothree/probiotic-cells.png';
import iconDigestion from '~/assets/biothree/icon-digestion.png';
import iconRoutine from '~/assets/biothree/icon-routine.png';
import iconBalance from '~/assets/biothree/icon-balance.png';
import productTabletas from '~/assets/biothree/tabletas.png';
import productSobres from '~/assets/biothree/sobres.png';
import scienceBg from '~/assets/biothree/science-bg.webp';

export const ASSETS = {
  probioticChain,
  probioticRods,
  probioticCells,
  iconDigestion,
  iconRoutine,
  iconBalance,
  productTabletas,
  productSobres,
  scienceBg,
} as const;

// Every abstract "bacteria" illustration available, for the hero to cycle through.
export const heroBacteria = [
  ASSETS.probioticCells,
  ASSETS.probioticRods,
  ASSETS.probioticChain,
];

// Ciencia and FAQ live on the same page, so they share one nav entry.
export const NAV = [
  {label: 'Producto', href: '/productos'},
  {label: 'Ciencia', href: '/ciencia'},
  {label: 'Blog', href: '/blogs/ciencia-intestinal'},
] as const;

export const hero = {
  title: 'Conoce BIO-THREE. Decide con información clara.',
  subtitle:
    'Conoce la formulación japonesa de BIO-THREE, compara sus presentaciones y consulta la información que necesitas para evaluar tu compra.',
  primaryCta: 'Comprar Biothree',
  secondaryCta: 'Conocer la evidencia',
  // Spec-sheet entries under the hero CTAs (label + value), instead of a
  // generic dotted strip. The commercial operator is identified in the footer.
  facts: [
    {label: 'Origen', value: 'Fórmula japonesa'},
    {label: 'Uso', value: 'Según el empaque'},
    {label: 'Presentaciones', value: 'Tabletas y sobres'},
  ],
};

export const benefits = {
  title: 'Tres claves para conocer Biothree.',
  cards: [
    {
      title: 'Tres tipos de bacterias',
      description:
        'La fórmula reúne bacterias sacarolíticas, lácticas y productoras de butirato.',
      icon: ASSETS.iconDigestion,
    },
    {
      title: 'Ciencia en contexto',
      description:
        'Conoce qué se ha investigado y qué límites tienen los resultados.',
      icon: ASSETS.iconBalance,
    },
    {
      title: 'Dos presentaciones',
      description:
        'Tabletas y sobres con indicaciones propias que puedes consultar en el empaque.',
      icon: ASSETS.iconRoutine,
    },
  ],
};

export const productPreview = {
  eyebrow: 'Producto',
  title: 'Una fórmula japonesa. Dos presentaciones.',
  subtitle:
    'BIO-THREE está disponible en tabletas y sobres. Compara los formatos y revisa las indicaciones de cada presentación.',
  cta: 'Consultar por Instagram',
};

export const howItWorks = {
  title: 'Antes de elegir, revisa estos puntos.',
  steps: [
    {
      number: '1',
      title: 'Revisa el empaque',
      description:
        'Comprueba la cantidad, la frecuencia y la edad de uso de tu presentación.',
    },
    {
      number: '2',
      title: 'Sigue las indicaciones',
      description:
        'No adaptes dosis de otros productos o estudios. Consulta si tienes dudas sobre su uso.',
    },
    {
      number: '3',
      title: 'Acompáñalo con buenos hábitos',
      description:
        'Biothree acompaña tu alimentación, hidratación y descanso. No los reemplaza.',
    },
  ],
};

export const scienceTeaser = {
  title: 'La ciencia, explicada simple.',
  body: 'Tres tipos de bacterias y una pregunta importante: ¿qué sabemos de su función? Conoce la relación entre BIO-THREE, la microbiota y el butirato, con las fuentes y los límites de la evidencia.',
  cta: 'Leer sobre la ciencia',
  href: '/ciencia',
  note: 'Información educativa · No es un medicamento',
};

export const faqPreview = {
  title: 'Preguntas rápidas',
  cta: 'Ver todas las preguntas',
  href: '/ciencia#faq',
};

export const finalCta = {
  title: 'Compara las presentaciones de BIO-THREE.',
  cta: 'Comprar Biothree',
  note: 'Disponible en tabletas y sobres',
};

export const productosPage = {
  eyebrow: 'Producto',
  heroTitle: 'Una fórmula japonesa. Dos presentaciones.',
  heroSubtitle:
    'Conoce BIO-THREE en tabletas y sobres. Compara sus formatos, consulta los precios y revisa la información de uso antes de elegir.',
  comparisonTitle: 'Compara las presentaciones',
  comparisonHeaders: ['Presentación', 'Preferencia de formato', 'Indicaciones', 'Formato'],
  buyCta: 'Consultar por Instagram',
  disclaimer:
    'Biothree es un suplemento alimenticio. No es un medicamento. No está destinado a diagnosticar, tratar, curar ni prevenir enfermedades.',
};

export const cienciaPage = {
  eyebrow: 'Ciencia',
  heroTitle: 'La ciencia intestinal, explicada con claridad.',
  heroSubtitle:
    'Qué contiene la fórmula, por qué importa la cepa y cómo leer la evidencia sin confundirla con una promesa.',
  sections: [
    {
      title: 'Una fórmula con tres tipos de bacterias',
      body: 'TOA describe BIO-THREE como una combinación de bacterias sacarolíticas, lácticas y productoras de butirato. Sus funciones explican el diseño de la fórmula; no garantizan un resultado individual.',
      image: ASSETS.iconBalance,
    },
    {
      title: 'El butirato es una molécula',
      body: 'Algunas bacterias producen este ácido graso de cadena corta. Estudiar el butirato no equivale a demostrar un beneficio de cualquier producto que contenga bacterias capaces de producirlo.',
      image: ASSETS.iconDigestion,
    },
    {
      title: 'La evidencia tiene un contexto',
      body: 'Antes de aplicar un resultado, hay que identificar la cepa, la preparación, la dosis y la población estudiada. Una evaluación de seguridad tampoco demuestra eficacia terapéutica.',
      image: ASSETS.iconRoutine,
    },
  ],
  faqTitle: 'Preguntas frecuentes',
  disclaimer:
    'La información de este sitio es educativa y no reemplaza la orientación de un profesional de salud. Biothree es un suplemento alimenticio, no un medicamento.',
};

export const footer = {
  tagline: 'BIO-THREE en Ecuador. Información clara para elegir.',
  // One flat row of links; the footer no longer has column headings.
  links: [
    {label: 'Productos', href: '/productos'},
    {label: 'Envíos', href: '/productos#envios'},
    {label: 'Ciencia', href: '/ciencia'},
    {label: 'Blog', href: '/blogs/ciencia-intestinal'},
    {label: 'Preguntas', href: '/ciencia#faq'},
    {label: 'Acerca de', href: '/acerca-de'},
    {label: 'Instagram', href: INSTAGRAM_URL},
    {label: 'Contacto', href: 'mailto:info@biothree.ec'},
  ],
  disclaimer:
    'Biothree es un suplemento alimenticio, no un medicamento. Consulta siempre las indicaciones del empaque. La información de este sitio es educativa y no reemplaza la orientación de un profesional de salud.',
  copyright: '© 2026 Biothree Ecuador. Todos los derechos reservados.',
};
