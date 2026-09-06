// Biothree is ONE Japanese probiotic formula, offered in TWO presentations.
// These are NOT separate products / SKUs / formulas — just two ways to take
// the same product.
//
// This file holds the *marketing* copy only. Price, stock and the buyable
// variant id come from Shopify at request time — see ~/lib/biothree.ts, which
// joins each entry here to a Shopify variant via `optionValue`.
//
// `ctaUrl` is the fallback CTA used until the Shopify product exists.

import {INSTAGRAM_URL, ASSETS} from './copy';

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
  image: string;
  ctaUrl: string;
  /**
   * Value of the "Presentación" option on the Shopify product that identifies
   * this presentation's variant. Must match the admin exactly (case-insensitive).
   */
  optionValue: string;
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
    optionValue: 'Tabletas',
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
    optionValue: 'Sobres',
    idealFor: 'Quienes prefieren mezclarlo o un formato individual',
    usage: '1 vez al día',
    format: 'Sobres',
  },
];
