// Biothree is ONE Japanese probiotic formula, offered in TWO presentations.
// These are NOT separate products / SKUs / formulas — just two ways to take
// the same product. CTAs point to Instagram until Shopify checkout is ready.

import {INSTAGRAM_URL, ASSETS} from './copy';

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
    // Presentation imagery: blister for tablets, sachet for sobres.
    image: ASSETS.iconBlister,
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
    image: ASSETS.iconSachet,
    ctaUrl: INSTAGRAM_URL,
    idealFor: 'Quienes prefieren mezclarlo o un formato individual',
    usage: '1 vez al día',
    format: 'Sobres',
  },
];
