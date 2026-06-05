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
          className="pointer-events-none absolute -right-16 -top-10 w-72 select-none opacity-20 sm:w-96"
        />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <SectionLabel>Productos</SectionLabel>
            <h1 className="font-tight text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {productosPage.heroTitle}
            </h1>
            <p className="text-lg leading-relaxed text-muted">
              {productosPage.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section>
        <div className="mx-auto max-w-6xl px-5 pb-16 md:pb-24">
          <ProductGrid variant="buy" />
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-cream/50">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Reveal>
            <h2 className="font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              {productosPage.comparisonTitle}
            </h2>
          </Reveal>

          {/* Desktop table */}
          <div className="mt-10 hidden overflow-hidden rounded-card border border-line bg-surface/70 md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-purple-soft/50">
                  {productosPage.comparisonHeaders.map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-purple-dark"
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
                    <td className="px-6 py-5 font-tight text-base font-semibold text-ink">
                      {product.name}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted">
                      {product.idealFor}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted">
                      {product.usage}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted">
                      {product.format}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="mt-10 flex flex-col gap-4 md:hidden">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-card border border-line bg-surface/70 p-6"
              >
                <h3 className="font-tight text-lg font-semibold text-ink">
                  {product.name}
                </h3>
                <dl className="mt-4 flex flex-col gap-3">
                  <div className="flex justify-between gap-4">
                    <dt className="font-mono text-xs uppercase tracking-[0.1em] text-purple">
                      Ideal para
                    </dt>
                    <dd className="text-right text-sm text-muted">
                      {product.idealFor}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-mono text-xs uppercase tracking-[0.1em] text-purple">
                      Uso
                    </dt>
                    <dd className="text-right text-sm text-muted">
                      {product.usage}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-mono text-xs uppercase tracking-[0.1em] text-purple">
                      Formato
                    </dt>
                    <dd className="text-right text-sm text-muted">
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
      <section className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-center text-sm leading-relaxed text-muted">
          {productosPage.disclaimer}
        </p>
      </section>
    </div>
  );
}
