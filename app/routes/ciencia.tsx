import {pageMeta} from '~/lib/seo';
import {ArticlePreview} from '~/components/marketing/ArticlePreview';
import {scienceSources} from '~/data/editorial';
import type {Route} from './+types/ciencia';
import {SectionLabel} from '~/components/marketing/SectionLabel';
import {FAQAccordion} from '~/components/marketing/FAQAccordion';
import {Reveal} from '~/components/marketing/Reveal';
import {cienciaPage} from '~/data/copy';
import {faqs} from '~/data/faq';

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: 'BIO-THREE, microbiota y butirato | Ciencia y preguntas',
    description:
      'Conoce los tres tipos de bacterias de BIO-THREE, qué es el butirato y los límites de la evidencia. Fuentes y preguntas frecuentes.',
    path: '/ciencia',
  });

export async function loader() {
  return {};
}

export default function Ciencia() {
  return (
    <div className="biothree">
      {/* Hero with science background */}
      <section className="relative overflow-hidden bg-background">
        <div className="bt-container bt-hero relative z-10">
          <div className="flex max-w-[720px] flex-col items-start gap-4">
            <SectionLabel>{cienciaPage.eyebrow}</SectionLabel>
            <h1 className="bt-h1 text-ink">{cienciaPage.heroTitle}</h1>
            <p className="bt-lead max-w-[600px] text-muted">
              {cienciaPage.heroSubtitle}
            </p>
            <span className="bt-index-label pt-2">
              Información educativa · No es un medicamento
            </span>
          </div>
        </div>
      </section>

      {/* Compact science explainer — three rows, one consistent icon system.
          Line icons only here, all the same size and panel treatment. */}
      <section>
        <div className="bt-container-narrow bt-section flex flex-col gap-6">
          {cienciaPage.sections.map((s) => (
            <Reveal key={s.title}>
              <div className="bt-rule-block flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
                <div className="bt-science-icon">
                  <img
                    src={s.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                  />
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

      <div className="bt-container-narrow pb-10">
        <p className="bt-note text-muted">
          Fuentes de esta explicación:{' '}
          {scienceSources
            .filter((source) => ['toa', 'nih', 'efsa'].includes(source.id))
            .map((source, index) => (
              <span key={source.id}>
                {index > 0 && ' · '}
                <a className="bt-editorial-link" href={source.url}>
                  {source.label}
                </a>
              </span>
            ))}
          .
        </p>
      </div>
      <ArticlePreview />
      {/* Full FAQ */}
      <section id="faq" className="scroll-mt-24">
        <div className="bt-container-narrow bt-section">
          <Reveal>
            <div className="flex flex-col items-start gap-4">
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
      <section>
        <div className="bt-container-narrow py-12">
          <p className="bt-legal-note mx-auto max-w-[64ch] text-center">
            {cienciaPage.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
