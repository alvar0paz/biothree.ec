import type {Route} from './+types/productos';
import {ProductGrid} from '~/components/marketing/ProductGrid';
import {SectionLabel} from '~/components/marketing/SectionLabel';
import {Reveal} from '~/components/marketing/Reveal';
import {ASSETS, productosPage} from '~/data/copy';
import {products} from '~/data/products';

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

export async function loader() {
  return {};
}

export default function Productos() {
  return (
    <div className="biothree">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={ASSETS.probioticChain}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-10 w-64 select-none opacity-20 sm:w-80"
        />
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

      {/* Two presentations. !pt-0 because the unlayered .bt-section-compact
          padding would otherwise beat a plain pt-0 utility. */}
      <section>
        <div className="bt-container bt-section-compact !pt-0">
          <h2 className="sr-only">Presentaciones</h2>
          <ProductGrid />
        </div>
      </section>

      {/* Comparison of the two presentations */}
      <section className="bg-cream/50">
        <div className="bt-container bt-section">
          <Reveal>
            <h2 className="bt-h2 text-ink">{productosPage.comparisonTitle}</h2>
          </Reveal>

          {/* Desktop table */}
          <div className="mt-8 hidden overflow-hidden rounded-card border border-line bg-surface/70 md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-purple-soft/50">
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
                {products.map((product) => (
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
            {products.map((product) => (
              <div
                key={product.id}
                className="bt-card border border-line bg-surface/70"
              >
                <h3 className="bt-h3 text-ink">{product.name}</h3>
                <dl className="pt-3 flex flex-col gap-2.5">
                  <div className="flex justify-between gap-4">
                    <dt className="bt-eyebrow font-mono text-[0.7rem] text-purple">
                      Ideal para
                    </dt>
                    <dd className="bt-p text-right text-muted">
                      {product.idealFor}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="bt-eyebrow font-mono text-[0.7rem] text-purple">
                      Uso
                    </dt>
                    <dd className="bt-p text-right text-muted">
                      {product.usage}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="bt-eyebrow font-mono text-[0.7rem] text-purple">
                      Formato
                    </dt>
                    <dd className="bt-p text-right text-muted">
                      {product.format}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section>
        <div className="bt-container-narrow py-10">
          <p className="bt-p text-center text-muted">{productosPage.disclaimer}</p>
        </div>
      </section>
    </div>
  );
}
