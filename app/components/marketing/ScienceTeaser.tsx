import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {scienceTeaser} from '~/data/copy';

export function ScienceTeaser() {
  return (
    <section>
      <div className="bt-container bt-section grid items-start gap-8 md:grid-cols-[1fr_1.2fr] md:gap-24">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel index="04">Ciencia</SectionLabel>
          <h2 className="bt-h2 text-ink">{scienceTeaser.title}</h2>
        </div>
        <div className="flex flex-col items-start gap-6">
          <p className="bt-lead text-muted">{scienceTeaser.body}</p>
          <Button href={scienceTeaser.href} variant="secondary">
            {scienceTeaser.cta}
          </Button>
          <p className="bt-index-label">{scienceTeaser.note}</p>
        </div>
      </div>
    </section>
  );
}
