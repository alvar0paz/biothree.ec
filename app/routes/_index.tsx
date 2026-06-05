import type {Route} from './+types/_index';
import {Hero} from '~/components/marketing/Hero';
import {BenefitCard} from '~/components/marketing/BenefitCard';
import {ProductGrid} from '~/components/marketing/ProductGrid';
import {HowItWorks} from '~/components/marketing/HowItWorks';
import {ScienceTeaser} from '~/components/marketing/ScienceTeaser';
import {FAQAccordion} from '~/components/marketing/FAQAccordion';
import {FinalCTA} from '~/components/marketing/FinalCTA';
import {SectionLabel} from '~/components/marketing/SectionLabel';
import {Button} from '~/components/marketing/Button';
import {Reveal} from '~/components/marketing/Reveal';
import {benefits, productPreview, faqPreview} from '~/data/copy';
import {faqs} from '~/data/faq';

export const meta: Route.MetaFunction = () => {
  return [
    {
      title: 'Biothree Ecuador | Probióticos japoneses para tu rutina diaria',
    },
    {
      name: 'description',
      content:
        'Probióticos japoneses para acompañar tu bienestar digestivo todos los días. Una rutina simple para cuidar tu microbiota.',
    },
  ];
};

export async function loader() {
  return {};
}

export default function Homepage() {
  return (
    <div className="biothree">
      <Hero />

      {/* Benefits */}
      <section className="bg-cream/50">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Reveal>
            <h2 className="max-w-2xl font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
              {benefits.title}
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.cards.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08}>
                <BenefitCard
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section>
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Reveal>
            <div className="flex flex-col items-start gap-4">
              <SectionLabel>Productos</SectionLabel>
              <h2 className="max-w-2xl font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {productPreview.title}
              </h2>
              <p className="max-w-xl text-lg text-muted">
                {productPreview.subtitle}
              </p>
            </div>
          </Reveal>
          <div className="mt-12">
            <ProductGrid variant="preview" />
          </div>
        </div>
      </section>

      <HowItWorks />

      <ScienceTeaser />

      {/* FAQ preview */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
          <Reveal>
            <div className="flex flex-col items-start gap-4">
              <SectionLabel>Preguntas</SectionLabel>
              <h2 className="font-tight text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
                {faqPreview.title}
              </h2>
            </div>
          </Reveal>
          <div className="mt-10">
            <FAQAccordion items={faqs.slice(0, 4)} />
          </div>
          <div className="mt-8">
            <Button href={faqPreview.href} variant="secondary">
              {faqPreview.cta}
            </Button>
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
