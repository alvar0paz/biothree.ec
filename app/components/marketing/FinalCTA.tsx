import {Button} from './Button';
import {ASSETS, finalCta} from '~/data/copy';

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-card border border-line bg-purple-soft px-6 py-16 text-center sm:px-12">
        {/* Subtle decorative visuals — kept low-opacity so text stays readable. */}
        <img
          src={ASSETS.probioticCells}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-10 w-40 select-none opacity-25 sm:w-52"
        />
        <img
          src={ASSETS.probioticRods}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -right-8 w-40 select-none opacity-25 sm:w-52"
        />

        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-7">
          <h2 className="font-tight text-3xl font-bold leading-tight tracking-tight text-purple-dark sm:text-4xl">
            {finalCta.title}
          </h2>
          <Button href="/productos" variant="primary" size="lg">
            {finalCta.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
