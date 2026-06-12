import {SectionLabel} from './SectionLabel';
import {Reveal} from './Reveal';
import {howItWorks} from '~/data/copy';

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bt-wash scroll-mt-24">
      <div className="bt-container bt-section">
        <div className="flex flex-col items-start gap-3">
          <SectionLabel>Cómo funciona</SectionLabel>
          <h2 className="bt-h2 max-w-[700px] text-ink">{howItWorks.title}</h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {howItWorks.steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.08} className="h-full">
              <div className="bt-card bt-card-hover flex h-full flex-col gap-3 border border-line bg-surface/60">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-tight text-sm font-semibold text-white">
                  {step.number}
                </span>
                <h3 className="bt-h3 text-ink">{step.title}</h3>
                <p className="bt-p text-muted">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
