import {useLoaderData} from 'react-router';
import type {Route} from './+types/productos';
import {ProductGrid} from '~/components/marketing/ProductGrid';
import {ProductDetails} from '~/components/marketing/ProductDetails';
import {ShippingInfo} from '~/components/marketing/ShippingInfo';
import {SectionLabel} from '~/components/marketing/SectionLabel';
import {Reveal} from '~/components/marketing/Reveal';
import {productosPage} from '~/data/copy';
import {loadPresentations} from '~/lib/biothree';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Productos Biothree | Probióticos japoneses en Ecuador'},
    {
      name: 'description',
      content:
        'Conoce las presentaciones de Biothree y elige una rutina probiótica diaria para acompañar tu bienestar intestinal.',
    },
  ];
};

export async function loader({context}: Route.LoaderArgs) {
  // Live price + stock for the two presentations. Never throws: an empty
  // Shopify admin yields variant: null and the cards fall back to Instagram.
  return {
    presentations: await loadPresentations(context.storefront, context.env),
  };
}

export default function Productos() {
  const {presentations} = useLoaderData<typeof loader>();

  return (
    <div className="biothree">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bt-container bt-hero relative z-10">
          <div className="flex max-w-[720px] flex-col items-start gap-4">
            <SectionLabel>{productosPage.eyebrow}</SectionLabel>
            <h1 className="bt-h1 text-ink">{productosPage.heroTitle}</h1>
            <p className="bt-lead max-w-[600px] text-muted">
              {productosPage.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Shared purchase presentations. */}
      <section>
        <div className="bt-container bt-section-compact pt-0">
          <h2 className="sr-only">Presentaciones</h2>
          <ProductGrid presentations={presentations} />
        </div>
      </section>

      {/* Comparison of the two presentations */}
      <section className="bt-section-divided">
        <div className="bt-container bt-section">
          <Reveal>
            <h2 className="bt-h2 text-ink">{productosPage.comparisonTitle}</h2>
          </Reveal>

          {/* Desktop table */}
          <div className="mt-8 hidden border-y border-line md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  {productosPage.comparisonHeaders.map((header) => (
                    <th
                      key={header}
                      className="bt-eyebrow px-6 py-4 font-mono text-xs text-purple-dark"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {presentations.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="bt-h3 px-6 py-5 text-ink">{product.name}</td>
                    <td className="bt-p px-6 py-5 text-muted">
                      {product.idealFor}
                    </td>
                    <td className="bt-p px-6 py-5 text-muted">
                      {product.usage}
                    </td>
                    <td className="bt-p px-6 py-5 text-muted">
                      {product.format}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="mt-8 flex flex-col gap-4 md:hidden">
            {presentations.map((product) => (
              <div key={product.id} className="bt-rule-block">
                <h3 className="bt-h3 text-ink">{product.name}</h3>
                <dl className="pt-3 flex flex-col gap-2.5">
                  <div className="bt-spec-row">
                    <dt className="bt-eyebrow font-mono text-xs text-purple">
                      Ideal para
                    </dt>
                    <dd className="bt-p text-left text-muted">
                      {product.idealFor}
                    </dd>
                  </div>
                  <div className="bt-spec-row">
                    <dt className="bt-eyebrow font-mono text-xs text-purple">
                      Uso
                    </dt>
                    <dd className="bt-p text-left text-muted">
                      {product.usage}
                    </dd>
                  </div>
                  <div className="bt-spec-row">
                    <dt className="bt-eyebrow font-mono text-xs text-purple">
                      Formato
                    </dt>
                    <dd className="bt-p text-left text-muted">
                      {product.format}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductDetails />
      <ShippingInfo />

      {/* Disclaimer */}
      <section>
        <div className="bt-container-narrow py-12">
          <p className="bt-legal-note border-t border-line pt-6 text-center">
            {productosPage.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
