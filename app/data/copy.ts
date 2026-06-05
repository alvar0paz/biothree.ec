// Central place for shared Spanish copy and asset paths.
// Compliance note: keep language safe — acompaña / apoya / contribuye /
// bienestar digestivo / rutina diaria / equilibrio intestinal / microbiota.
// Avoid: cura, trata, previene enfermedades, desinflama, etc.

export const ASSETS = {
  probioticChain: '/assets/biothree/probiotic-chain.png',
  probioticRods: '/assets/biothree/probiotic-rods.png',
  probioticCells: '/assets/biothree/probiotic-cells.png',
  iconDigestion: '/assets/biothree/icon-digestion.png',
  iconRoutine: '/assets/biothree/icon-routine.png',
  iconBalance: '/assets/biothree/icon-balance.png',
  scienceBg: '/assets/biothree/science-bg.png',
} as const;

export const NAV = [
  {label: 'Productos', href: '/productos'},
  {label: 'Ciencia', href: '/ciencia'},
  {label: 'Preguntas', href: '/ciencia#faq'},
] as const;

export const hero = {
  eyebrow: 'Fórmula japonesa · Bienestar intestinal · Uso diario',
  title: 'Probióticos japoneses para tu rutina diaria.',
  subtitle:
    'Biothree combina probióticos seleccionados en una fórmula simple, pensada para acompañar tu bienestar digestivo todos los días.',
  primaryCta: 'Comprar Biothree',
  secondaryCta: 'Ver cómo funciona',
};

export const benefits = {
  title: 'Sentirse bien también empieza en el intestino.',
  cards: [
    {
      title: 'Digestión diaria',
      description:
        'Acompaña tu bienestar digestivo con una rutina probiótica simple.',
      icon: ASSETS.iconDigestion,
    },
    {
      title: 'Equilibrio intestinal',
      description: 'Apoya el balance natural de tu microbiota todos los días.',
      icon: ASSETS.iconBalance,
    },
    {
      title: 'Rutina simple',
      description: 'Una toma al día. Sin complicaciones. Sin promesas exageradas.',
      icon: ASSETS.iconRoutine,
    },
  ],
};

export const productPreview = {
  title: 'Tres formas de empezar una rutina Biothree.',
  subtitle: 'Elige la presentación que mejor se adapta a tu día a día.',
  cta: 'Ver producto',
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
};

export const faqPreview = {
  title: 'Preguntas rápidas',
  cta: 'Ver todas las preguntas',
  href: '/ciencia#faq',
};

export const finalCta = {
  title: 'Empieza con una rutina simple para tu bienestar digestivo.',
  cta: 'Comprar Biothree',
};

export const productosPage = {
  heroTitle: 'Elige tu Biothree.',
  heroSubtitle:
    'Tres presentaciones de probióticos japoneses para acompañar tu bienestar intestinal diario.',
  comparisonTitle: 'Compara las presentaciones',
  comparisonHeaders: ['Producto', 'Ideal para', 'Uso', 'Formato'],
  buyCta: 'Comprar',
  disclaimer:
    'Biothree es un suplemento alimenticio. No es un medicamento. No está destinado a diagnosticar, tratar, curar ni prevenir enfermedades.',
};

export const cienciaPage = {
  heroTitle: 'La ciencia detrás de Biothree, sin complicarla.',
  heroSubtitle:
    'Creemos en explicar lo que vendemos con claridad: qué son los probióticos, por qué importan y cómo pueden formar parte de una rutina diaria.',
  sections: [
    {
      title: '¿Qué son los probióticos?',
      body: 'Los probióticos son microorganismos vivos que se consumen como parte de alimentos o suplementos. Cuando se consumen en cantidades adecuadas, pueden contribuir al bienestar del huésped.',
      image: ASSETS.iconBalance,
    },
    {
      title: '¿Por qué importa la microbiota?',
      body: 'La microbiota intestinal participa en procesos relacionados con la digestión, la absorción de nutrientes y el equilibrio general del intestino. Cuidarla puede ser parte de una rutina saludable.',
      image: ASSETS.iconDigestion,
    },
    {
      title: '¿Qué hace diferente a Biothree?',
      body: 'Biothree está basado en una fórmula japonesa de probióticos, presentada de forma simple para que sea fácil incorporarla al día a día.',
      image: ASSETS.probioticRods,
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
        {label: 'Comprar', href: '/productos'},
        {label: 'Contacto', href: 'mailto:info@biothree.ec'},
      ],
    },
  ],
  disclaimer:
    'Biothree es un suplemento alimenticio, no un medicamento. La información de este sitio es educativa y no reemplaza la orientación de un profesional de salud.',
  copyright: '© 2026 Biothree Ecuador. Todos los derechos reservados.',
};
