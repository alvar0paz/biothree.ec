import type {Route} from './+types/ciencia';
import {SectionLabel} from '~/components/marketing/SectionLabel';
import {FAQAccordion} from '~/components/marketing/FAQAccordion';
import {Reveal} from '~/components/marketing/Reveal';
import {ASSETS, cienciaPage} from '~/data/copy';
import {faqs} from '~/data/faq';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Ciencia y preguntas frecuentes | Biothree Ecuador'},
    {
      name: 'description',
      content:
        'Aprende qué son los probióticos, cómo funcionan y cómo Biothree puede formar parte de una rutina diaria de bienestar intestinal.',
    },
  ];
};

export async function loader() {
  return {};
}

export default function Ciencia() {
  return (
    <div className="biothree">
      {/* Hero with science background */}
      <section className="relative overflow-hidden bg-background">
        <img
          src={ASSETS.scienceBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-background/70" aria-hidden="true" />
        <div className="bt-container bt-hero relative z-10">
          <div className="flex max-w-[720px] flex-col items-start gap-4">
            <SectionLabel>{cienciaPage.eyebrow}</SectionLabel>
            <h1 className="bt-h1 text-ink">{cienciaPage.heroTitle}</h1>
            <p className="bt-lead max-w-[600px] text-muted">
              {cienciaPage.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Compact science explainer — three rows, one consistent icon system.
          Line icons only here, all the same size and panel treatment. */}
      <section>
        <div className="bt-container-narrow bt-section flex flex-col gap-6">
          {cienciaPage.sections.map((s) => (
            <Reveal key={s.title}>
              <div className="flex items-center gap-6 rounded-card border border-line bg-surface/60 p-6 sm:gap-8 sm:p-7">
                <div className="bt-science-icon">
                  <img src={s.image} alt="" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="bt-h3 text-ink">{s.title}</h2>
                  <p className="bt-p text-muted">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Full FAQ */}
      <section id="faq" className="scroll-mt-24 bg-cream/50">
        <div className="bt-container-narrow bt-section">
          <Reveal>
            <div className="flex flex-col items-start gap-3">
              <SectionLabel>Preguntas</SectionLabel>
              <h2 className="bt-h2 text-ink">{cienciaPage.faqTitle}</h2>
            </div>
          </Reveal>
          <div className="mt-8">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bt-container-narrow py-10">
        <p className="bt-p text-center text-muted">{cienciaPage.disclaimer}</p>
      </section>
    </div>
  );
}
