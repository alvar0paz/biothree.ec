import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {Reveal} from './Reveal';
import {ASSETS, scienceTeaser} from '~/data/copy';

export function ScienceTeaser() {
  return (
    <section className="relative overflow-hidden bg-background">
      <img
        src={ASSETS.scienceBg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

      <div className="bt-container bt-section relative z-10 grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14">
        {/* Editorial copy column */}
        <Reveal>
          <div className="flex max-w-[560px] flex-col items-start gap-4">
            <SectionLabel>Ciencia</SectionLabel>
            <h2 className="bt-h2 text-ink">{scienceTeaser.title}</h2>
            <p className="bt-lead text-muted">{scienceTeaser.body}</p>
            <div className="mt-1">
              <Button href={scienceTeaser.href} variant="secondary" size="lg">
                {scienceTeaser.cta}
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Visual card column */}
        <Reveal delay={0.1}>
          <div className="mx-auto w-full max-w-[400px] rounded-card border border-line bg-surface/80 p-5">
            <div className="bt-stage flex h-[220px] items-center justify-center rounded-[18px]">
              <img
                src={ASSETS.probioticChain}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-40 w-40 select-none object-contain"
              />
            </div>
            <p className="bt-note mt-4 text-center text-muted">
              {scienceTeaser.note}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
