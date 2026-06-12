import {SectionLabel} from './SectionLabel';
import {Reveal} from './Reveal';
import {ASSETS, howItWorks} from '~/data/copy';

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24">
      <div className="bt-container bt-section">
        <div className="flex flex-col items-start gap-3">
          <SectionLabel>Cómo funciona</SectionLabel>
          <h2 className="bt-h2 max-w-[700px] text-ink">{howItWorks.title}</h2>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {howItWorks.steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.08}>
              <div className="bt-card flex h-full flex-col gap-3 border border-line bg-surface/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-tight text-sm font-semibold text-white">
                    {step.number}
                  </span>
                  {i === 0 && (
                    <img
                      src={ASSETS.iconRoutine}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="ml-auto h-10 w-10 object-contain opacity-90"
                    />
                  )}
                </div>
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
