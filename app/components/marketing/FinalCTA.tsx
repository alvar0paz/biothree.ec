import {Button} from './Button';
import {finalCta} from '~/data/copy';

export function FinalCTA() {
  return (
    <section>
      <div className="bt-container bt-section grid items-center gap-8 md:grid-cols-[1.5fr_1fr] md:gap-24">
        <h2 className="bt-h2 text-ink">{finalCta.title}</h2>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <Button href="/productos" size="lg">
            {finalCta.cta}
          </Button>
          <p className="bt-note text-muted">{finalCta.note}</p>
        </div>
      </div>
    </section>
  );
}
