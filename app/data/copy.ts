// Central place for shared Spanish copy and asset paths.
// Compliance note: keep language safe — acompaña / apoya / contribuye /
// bienestar digestivo / rutina diaria / equilibrio intestinal / microbiota.
// Avoid: cura, trata, previene enfermedades, desinflama, etc.

// All purchase CTAs point here until Shopify checkout is integrated.
export const INSTAGRAM_URL = 'https://instagram.com/biothree.ec';

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
] as const;

export const hero = {
  eyebrow: 'Fórmula japonesa · Bienestar intestinal · Uso diario',
  title: 'Probióticos japoneses para tu rutina diaria.',
  subtitle:
    'Biothree combina probióticos seleccionados en una fórmula simple, pensada para acompañar tu bienestar digestivo todos los días.',
  primaryCta: 'Comprar Biothree',
  secondaryCta: 'Ver cómo funciona',
  // Quiet trust strip rendered below the hero CTAs.
  trust: [
    'Fórmula japonesa',
    'Uso diario',
    'Importado por BIOSCIENCE TRADING EC',
    'Ecuador',
  ],
};

export const benefits = {
  title:
    'Una sola fórmula para acompañar tres momentos clave de tu bienestar intestinal.',
  cards: [
    {
      title: 'Digestión diaria',
      description:
        'Acompaña tu bienestar digestivo como parte de una rutina constante.',
      icon: ASSETS.iconDigestion,
    },
    {
      title: 'Equilibrio intestinal',
      description: 'Apoya el balance natural de tu microbiota todos los días.',
      icon: ASSETS.iconBalance,
    },
    {
      title: 'Rutina simple',
      description: 'Una toma diaria, fácil de integrar a tu día.',
      icon: ASSETS.iconRoutine,
    },
  ],
};

export const productPreview = {
  eyebrow: 'Producto',
  title: 'Una fórmula japonesa. Dos presentaciones.',
  subtitle:
    'Biothree está disponible en tabletas y sobres para que puedas incorporarlo a tu rutina de la forma que prefieras.',
  cta: 'Consultar por Instagram',
};

export const howItWorks = {
  title: 'Cómo incorporar Biothree a tu día.',
  steps: [
    {
      number: '1',
      title: 'Tómalo una vez al día',
      description:
        'Hazlo parte de una rutina que ya existe: desayuno, almuerzo o noche.',
    },
    {
      number: '2',
      title: 'Sé constante',
      description:
        'Los probióticos funcionan mejor cuando se toman de forma regular.',
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
  body: 'Los probióticos son microorganismos vivos que, consumidos en cantidades adecuadas, pueden aportar beneficios al huésped. En Biothree, la idea es simple: convertir el cuidado intestinal en una rutina diaria clara y fácil de seguir.',
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
  title: 'Empieza con una rutina simple para tu bienestar digestivo.',
  cta: 'Consultar por Instagram',
  note: 'Disponible en tabletas y sobres',
};

export const productosPage = {
  eyebrow: 'Producto',
  heroTitle: 'Una fórmula japonesa. Dos presentaciones.',
  heroSubtitle:
    'Biothree es un solo producto probiótico japonés, disponible en tabletas y sobres para que lo incorpores a tu rutina de la forma que prefieras.',
  comparisonTitle: 'Compara las presentaciones',
  comparisonHeaders: ['Presentación', 'Ideal para', 'Uso', 'Formato'],
  buyCta: 'Consultar por Instagram',
  disclaimer:
    'Biothree es un suplemento alimenticio. No es un medicamento. No está destinado a diagnosticar, tratar, curar ni prevenir enfermedades.',
};

export const cienciaPage = {
  eyebrow: 'Ciencia',
  heroTitle: 'Probióticos, microbiota y rutina diaria.',
  heroSubtitle:
    'Una explicación simple sobre cómo Biothree acompaña el bienestar intestinal como parte de una rutina constante.',
  // Science page uses the line icons only, at one consistent size.
  sections: [
    {
      title: '¿Qué son los probióticos?',
      body: 'Los probióticos son microorganismos vivos presentes en alimentos y suplementos. Cuando se consumen en cantidades adecuadas, pueden contribuir al bienestar del huésped.',
      image: ASSETS.iconBalance,
    },
    {
      title: '¿Por qué importa la microbiota?',
      body: 'La microbiota intestinal participa en procesos relacionados con la digestión, la absorción de nutrientes y el equilibrio general del intestino.',
      image: ASSETS.iconDigestion,
    },
    {
      title: '¿Qué hace diferente a Biothree?',
      body: 'Biothree está basado en una fórmula japonesa de probióticos, presentada de forma simple para incorporarse al día a día.',
      image: ASSETS.iconRoutine,
    },
  ],
  faqTitle: 'Preguntas frecuentes',
  disclaimer:
    'La información de este sitio es educativa y no reemplaza la orientación de un profesional de salud. Biothree es un suplemento alimenticio, no un medicamento.',
};

export const footer = {
  tagline:
    'Probióticos japoneses para acompañar tu bienestar digestivo todos los días.',
  columns: [
    {
      title: 'Producto',
      links: [
        {label: 'Productos', href: '/productos'},
        {label: 'Ciencia', href: '/ciencia'},
        {label: 'Preguntas', href: '/ciencia#faq'},
      ],
    },
    {
      title: 'Biothree',
      links: [
        {label: 'Consultar por Instagram', href: INSTAGRAM_URL},
        {label: 'Contacto', href: 'mailto:info@biothree.ec'},
      ],
    },
  ],
  // Bottom legal strip. The "·" separators are rendered inline on desktop and
  // wrap naturally on mobile. Company legal name is the only all-caps element.
  legalLine1: [
    'Biothree es un suplemento alimenticio',
    'No es un medicamento',
    'Consulta siempre las indicaciones del empaque',
    'La información de este sitio es educativa y no reemplaza la orientación de un profesional de salud',
  ],
  importer: 'BIOSCIENCE TRADING EC',
  legalLine2: ['Ecuador', '© 2026 Biothree Ecuador. Todos los derechos reservados.'],
};
