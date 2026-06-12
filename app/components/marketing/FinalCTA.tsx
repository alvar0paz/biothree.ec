import {Button} from './Button';
import {ASSETS, finalCta, INSTAGRAM_URL} from '~/data/copy';

export function FinalCTA() {
  return (
    <section>
      <div className="bt-container bt-section-compact">
        <div className="relative overflow-hidden rounded-card border border-line bg-purple-soft px-6 py-14 text-center sm:px-12">
        {/* Subtle decorative visuals — kept low-opacity so text stays readable. */}
        <img
          src={ASSETS.probioticCells}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute -left-10 -top-10 w-36 select-none opacity-20 sm:w-48"
        />
        <img
          src={ASSETS.probioticRods}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute -bottom-12 -right-8 w-36 select-none opacity-20 sm:w-48"
        />

        <div className="relative z-10 mx-auto flex max-w-[600px] flex-col items-center gap-6">
          <h2 className="bt-h2 text-purple-dark">{finalCta.title}</h2>
          <Button href={INSTAGRAM_URL} variant="primary" size="lg">
            {finalCta.cta}
          </Button>
        </div>
        </div>
      </div>
    </section>
  );
}
