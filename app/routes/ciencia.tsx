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
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 md:py-28">
          <div className="flex max-w-2xl flex-col items-start gap-5">
            <SectionLabel>Ciencia</SectionLabel>
            <h1 className="font-tight text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {cienciaPage.heroTitle}
            </h1>
            <p className="text-lg leading-relaxed text-muted">
              {cienciaPage.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Content sections — alternating image / copy */}
      <section>
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-5 py-16 md:py-24">
          {cienciaPage.sections.map((s, i) => (
            <Reveal key={s.title}>
              <div
                className={`grid items-center gap-8 md:grid-cols-2 ${
                  i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="flex justify-center">
                  <div className="flex h-48 w-48 items-center justify-center rounded-card bg-cream sm:h-56 sm:w-56">
                    <img
                      src={s.image}
                      alt=""
                      aria-hidden="true"
                      className="h-32 w-32 object-contain sm:h-36 sm:w-36"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h2 className="font-tight text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
                    {s.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-muted">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Full FAQ */}
      <section id="faq" className="scroll-mt-24 bg-cream/50">
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
          <Reveal>
            <div className="flex flex-col items-start gap-4">
              <SectionLabel>Preguntas</SectionLabel>
              <h2 className="font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {cienciaPage.faqTitle}
              </h2>
            </div>
          </Reveal>
          <div className="mt-10">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-3xl px-5 py-12">
        <p className="text-center text-sm leading-relaxed text-muted">
          {cienciaPage.disclaimer}
        </p>
      </section>
    </div>
  );
}
