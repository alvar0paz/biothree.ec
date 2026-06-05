// Product configuration for the Biothree marketing site.
// Names and prices are placeholders — easy to change here in one place.
// checkoutUrl uses placeholder links for now; swap in Shopify checkout URLs later.

export type Product = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  bullets: string[];
  price: string;
  image: string;
  checkoutUrl: string;
  // Fields used by the comparison table on /productos.
  idealFor: string;
  usage: string;
  format: string;
};

export const products: Product[] = [
  {
    id: 'biothree-01',
    name: 'Biothree Digestión',
    shortName: 'Digestión diaria',
    description:
      'Probióticos japoneses para acompañar tu bienestar digestivo como parte de una rutina diaria.',
    bullets: ['Uso diario', 'Fórmula japonesa', 'Rutina simple'],
    price: '$XX.XX',
    image: '/assets/biothree/probiotic-chain.png',
    checkoutUrl: '#',
    idealFor: 'Empezar una rutina digestiva diaria',
    usage: '1 vez al día',
    format: 'Caja mensual',
  },
  {
    id: 'biothree-02',
    name: 'Biothree Rutina',
    shortName: 'Rutina simple',
    description:
      'Una presentación pensada para quienes quieren incorporar probióticos de forma fácil y constante.',
    bullets: ['Una toma al día', 'Fácil de incorporar', 'Apoya tu microbiota'],
    price: '$XX.XX',
    image: '/assets/biothree/probiotic-rods.png',
    checkoutUrl: '#',
    idealFor: 'Incorporar probióticos con constancia',
    usage: '1 vez al día',
    format: 'Caja mensual',
  },
  {
    id: 'biothree-03',
    name: 'Biothree Balance',
    shortName: 'Equilibrio intestinal',
    description:
      'Una fórmula para acompañar el equilibrio natural de tu microbiota todos los días.',
    bullets: [
      'Bienestar desde adentro',
      'Presentación mensual',
      'Información clara',
    ],
    price: '$XX.XX',
    image: '/assets/biothree/probiotic-cells.png',
    checkoutUrl: '#',
    idealFor: 'Acompañar el equilibrio intestinal',
    usage: '1 vez al día',
    format: 'Caja mensual',
  },
];
