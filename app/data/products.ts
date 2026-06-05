// Biothree is ONE Japanese probiotic formula, offered in TWO presentations.
// These are NOT separate products / SKUs / formulas — just two ways to take
// the same product. CTAs point to Instagram until Shopify checkout is ready.

import {INSTAGRAM_URL} from './copy';

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
  image: string;
  ctaUrl: string;
  // Used by the presentation comparison table on /productos.
  idealFor: string;
  usage: string;
  format: string;
};

export const products: Product[] = [
  {
    id: 'biothree-tabletas',
    name: 'Biothree Tabletas',
    tagline: 'Tabletas',
    description: 'Para una rutina diaria simple y práctica.',
    bullets: ['Uso diario', 'Fácil de llevar', 'Ideal para una rutina constante'],
    // Both presentations share the same unified Bio3 composition so the cards
    // read as one product, not two different formulas.
    image: '/assets/biothree/probiotic-cells.png',
    ctaUrl: INSTAGRAM_URL,
    idealFor: 'Una rutina constante y fácil de llevar',
    usage: '1 vez al día',
    format: 'Tabletas',
  },
  {
    id: 'biothree-sobres',
    name: 'Biothree Sobres',
    tagline: 'Sobres',
    description: 'Para una presentación individual fácil de llevar o mezclar.',
    bullets: [
      'Presentación individual',
      'Fácil de incorporar',
      'Pensada para el día a día',
    ],
    image: '/assets/biothree/probiotic-cells.png',
    ctaUrl: INSTAGRAM_URL,
    idealFor: 'Quienes prefieren mezclarlo o un formato individual',
    usage: '1 vez al día',
    format: 'Sobres',
  },
];
