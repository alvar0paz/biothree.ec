import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {ASSETS, scienceTeaser} from '~/data/copy';

export function ScienceTeaser() {
  return (
    <section className="relative overflow-hidden bg-background">
      <img
        src={ASSETS.scienceBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

      <div className="bt-container bt-section relative z-10">
        <div className="flex max-w-[620px] flex-col items-start gap-4">
          <SectionLabel>Ciencia</SectionLabel>
          <h2 className="bt-h2 text-ink">{scienceTeaser.title}</h2>
          <p className="bt-lead text-muted">{scienceTeaser.body}</p>
          <Button href={scienceTeaser.href} variant="primary" size="lg">
            {scienceTeaser.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
