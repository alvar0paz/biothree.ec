import {SectionLabel} from './SectionLabel';
import {howItWorks} from '~/data/copy';

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24">
      <div className="bt-container bt-section bt-steps">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel index="03">Cómo funciona</SectionLabel>
          <h2 className="bt-h2 text-ink">{howItWorks.title}</h2>
        </div>
        <div>
          {howItWorks.steps.map((step) => (
            <div key={step.number} className="bt-step">
              <span className="bt-card-number pt-1">
                {step.number.padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="bt-h3 text-ink">{step.title}</h3>
                <p className="bt-p text-muted">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
