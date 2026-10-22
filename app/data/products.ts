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
    name: 'BIO-THREE Tabletas',
    tagline: 'Tabletas',
    description: 'Presentación en tabletas, envasadas en blíster.',
    bullets: [
      'Tabletas en blíster',
      'Información de uso en el empaque',
      'Consulta la conservación y la fecha de vencimiento',
    ],
    // Presentation imagery: blister for tablets, sachet for sobres.
    image: ASSETS.productTabletas,
    ctaUrl: INSTAGRAM_URL,
    optionValue: 'Tabletas',
    idealFor: 'Si prefieres tabletas',
    usage: 'Según las indicaciones del empaque',
    format: 'Tabletas en blíster',
  },
  {
    id: 'biothree-sobres',
    name: 'BIO-THREE Sobres',
    tagline: 'Sobres',
    description: 'Presentación en polvo oral, en sobres individuales.',
    bullets: [
      'Presentación individual',
      'Información de preparación en el empaque',
      'Consulta la conservación y la fecha de vencimiento',
    ],
    image: ASSETS.productSobres,
    ctaUrl: INSTAGRAM_URL,
    optionValue: 'Sobres',
    idealFor: 'Si prefieres polvo oral',
    usage: 'Según las indicaciones del empaque',
    format: 'Sobres individuales de polvo oral',
  },
];
