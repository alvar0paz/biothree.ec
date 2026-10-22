// Shopify models BIO-THREE as one product with two presentation variants.
// Each presentation has its own packaging and instructions.
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
    description: 'Caja con 42 tabletas en blíster. Contenido neto: 8,4 g.',
    bullets: [
      '42 tabletas en blíster',
      'Información de uso en el empaque',
      'Consulta la conservación y la fecha de vencimiento',
    ],
    // Front panel rendered from the supplied current Ecuador packaging artwork.
    image: ASSETS.productTabletas,
    ctaUrl: INSTAGRAM_URL,
    optionValue: 'Tabletas',
    idealFor: 'Si prefieres tabletas',
    usage: 'Según las indicaciones del empaque',
    format: 'Caja con 42 tabletas en blíster',
  },
  {
    id: 'biothree-sobres',
    name: 'BIO-THREE Sobres',
    tagline: 'Sobres',
    description:
      'Caja con 21 sobres individuales de polvo oral. Contenido neto: 21 g.',
    bullets: [
      '21 sobres individuales',
      'Información de preparación en el empaque',
      'Consulta la conservación y la fecha de vencimiento',
    ],
    image: ASSETS.productSobres,
    ctaUrl: INSTAGRAM_URL,
    optionValue: 'Sobres',
    idealFor: 'Si prefieres polvo oral',
    usage: 'Según las indicaciones del empaque',
    format: 'Caja con 21 sobres de polvo oral',
  },
];
