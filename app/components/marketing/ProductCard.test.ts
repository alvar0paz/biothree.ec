import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router';
import {describe, expect, it} from 'vitest';
import {Aside} from '~/components/Aside';
import {products} from '~/data/products';
import type {Presentation} from '~/lib/biothree';
import Homepage from '~/routes/_index';
import Productos from '~/routes/productos';

const presentations: Presentation[] = products.map((product, index) => ({
  ...product,
  variant: {
    id: `gid://shopify/ProductVariant/${index + 1}`,
    title: product.tagline,
    sku: product.id,
    availableForSale: true,
    quantityAvailable: 10,
    price: {amount: '29.00', currencyCode: 'USD'},
    compareAtPrice: null,
    selectedOptions: [{name: 'Presentación', value: product.optionValue}],
    image: null,
  },
}));

async function renderPage(path: string, items: Presentation[]) {
  const handler = createStaticHandler([
    {
      path: '/',
      Component: Homepage,
      loader: () => ({presentations: items}),
    },
    {
      path: '/productos',
      Component: Productos,
      loader: () => ({presentations: items}),
    },
  ]);
  const context = await handler.query(
    new Request(`https://biothree.test${path}`),
  );
  if (context instanceof Response) throw new Error('Unexpected route response');

  return renderToStaticMarkup(
    createElement(
      Aside.Provider,
      null,
      createElement(StaticRouterProvider, {
        router: createStaticRouter(handler.dataRoutes, context),
        context,
        hydrate: false,
      }),
    ),
  );
}

describe.each(['/', '/productos'])('Product cards on %s', (path) => {
  it('submits both presentations to the cart without Instagram purchase links', async () => {
    const html = await renderPage(path, presentations);

    expect(html.match(/action="\/cart"/g)).toHaveLength(2);
    expect(html.match(/Agregar al carrito/g)).toHaveLength(2);
    for (const presentation of presentations) {
      expect(html).toContain(presentation.variant!.id);
    }
    expect(html).not.toContain('instagram.com');
  });

  it('keeps the Instagram fallback when Shopify product data is unavailable', async () => {
    const html = await renderPage(
      path,
      presentations.map((presentation) => ({...presentation, variant: null})),
    );

    expect(html.match(/Consultar por Instagram/g)).toHaveLength(2);
    expect(html).not.toContain('action="/cart"');
    expect(
      html.match(/href="https:\/\/instagram.com\/biothree.ec"/g),
    ).toHaveLength(2);
  });

  it('keeps a sold-out presentation disabled while the other remains purchasable', async () => {
    const html = await renderPage(
      path,
      presentations.map((presentation, index) => ({
        ...presentation,
        variant: {...presentation.variant!, availableForSale: index !== 0},
      })),
    );

    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Agotado<\/button>/);
    expect(html.match(/action="\/cart"/g)).toHaveLength(1);
    expect(html).not.toContain('Reintentar disponibilidad');
    expect(html).not.toContain('instagram.com');
  });
});
