import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {ASSETS, scienceTeaser} from '~/data/copy';

export function ScienceTeaser() {
  return (
    <section className="bt-section-divided">
      <div className="bt-container bt-section grid items-center gap-12 md:grid-cols-[1fr_1.2fr] md:gap-24">
        <figure className="m-0 order-2 md:order-1">
          <img
            src={ASSETS.probioticChain}
            alt=""
            loading="lazy"
            decoding="async"
            className="mx-auto h-64 w-full object-contain md:h-80"
          />
          <figcaption className="bt-note mt-6 border-t border-line pt-4 text-muted">
            {scienceTeaser.note}
          </figcaption>
        </figure>
        <div className="order-1 flex flex-col items-start gap-6 md:order-2">
          <SectionLabel>Ciencia</SectionLabel>
          <h2 className="bt-h2 text-ink">{scienceTeaser.title}</h2>
          <p className="bt-lead text-muted">{scienceTeaser.body}</p>
          <Button href={scienceTeaser.href} variant="secondary">
            {scienceTeaser.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
