import {describe, expect, it} from 'vitest';
import {pageMeta} from './seo';
import {
  loader as sitemap,
  editorialPaths,
} from '~/routes/[sitemap-editorial.xml]';
import {SCIENCE_ARTICLE_PATH, SCIENCE_BLOG_PATH} from '~/data/editorial';
import {meta as productMeta} from '~/routes/products.$handle';

const product = {
  title: 'Biothree',
  handle: 'biothree',
  description: 'Descripción del producto',
  seo: {title: '', description: ''},
  selectedOrFirstAvailableVariant: {
    price: {amount: '32.95', currencyCode: 'USD'},
    availableForSale: false,
    image: {url: 'https://cdn.shopify.com/sobres.png'},
    selectedOptions: [{name: 'Presentación', value: 'Sobres'}],
  },
};

describe('Search metadata contract', () => {
  it('renders a canonical link descriptor, not the invalid meta descriptor previously shipped', () => {
    expect(
      pageMeta({title: 'Ciencia', description: 'Fuentes', path: '/ciencia'}),
    ).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://biothree.ec/ciencia',
    });
  });
  it('uses the selected Shopify offer and a URL that retains that selection', () => {
    const descriptors = productMeta({data: {product}} as never);
    const schema = descriptors.find((item) => 'script:ld+json' in item) as {
      'script:ld+json': {
        offers: {price: string; availability: string; url: string};
      };
    };
    expect(schema['script:ld+json'].offers.price).toBe('32.95');
    expect(schema['script:ld+json'].offers.availability).toBe(
      'https://schema.org/OutOfStock',
    );
    expect(
      new URL(schema['script:ld+json'].offers.url).searchParams.get(
        'Presentación',
      ),
    ).toBe('Sobres');
  });
  it('does not emit a product or canonical URL for a missing product', () => {
    const descriptors = productMeta({data: undefined} as never);
    expect(descriptors).toContainEqual({name: 'robots', content: 'noindex'});
    expect(
      descriptors.some((item) => 'script:ld+json' in item || 'rel' in item),
    ).toBe(false);
  });
  it('makes marketing and editorial pages discoverable without fictional lastmod dates', async () => {
    const response = sitemap();
    const body = await response.text();
    expect(response.headers.get('Content-Type')).toContain('application/xml');
    for (const path of [
      '/',
      '/productos',
      '/ciencia',
      SCIENCE_BLOG_PATH,
      SCIENCE_ARTICLE_PATH,
    ]) {
      expect(body).toContain(`<loc>https://biothree.ec${path}</loc>`);
    }
    expect(new Set(editorialPaths).size).toBe(editorialPaths.length);
    expect(body).not.toContain('<lastmod>');
    expect(body).not.toContain('/test');
  });
});
