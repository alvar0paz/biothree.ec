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

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="flex max-w-xl flex-col items-start gap-5">
          <SectionLabel>Ciencia</SectionLabel>
          <h2 className="font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {scienceTeaser.title}
          </h2>
          <p className="text-lg leading-relaxed text-muted">
            {scienceTeaser.body}
          </p>
          <Button href={scienceTeaser.href} variant="primary" size="lg">
            {scienceTeaser.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
