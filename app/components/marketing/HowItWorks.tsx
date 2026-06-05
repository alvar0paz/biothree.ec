import {SectionLabel} from './SectionLabel';
import {Reveal} from './Reveal';
import {ASSETS, howItWorks} from '~/data/copy';

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel>Cómo funciona</SectionLabel>
          <h2 className="max-w-2xl font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            {howItWorks.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {howItWorks.steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 0.08}>
              <div className="flex h-full flex-col gap-4 rounded-card border border-line bg-surface/60 p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-tight text-base font-semibold text-white">
                    {step.number}
                  </span>
                  {i === 0 && (
                    <img
                      src={ASSETS.iconRoutine}
                      alt=""
                      aria-hidden="true"
                      className="ml-auto h-12 w-12 object-contain opacity-90"
                    />
                  )}
                </div>
                <h3 className="font-tight text-xl font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
