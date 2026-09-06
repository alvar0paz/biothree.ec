import {useLoaderData} from 'react-router';
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
import {loadPresentations} from '~/lib/biothree';

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

export async function loader({context}: Route.LoaderArgs) {
  // Live price + stock for the two presentations. Never throws: an empty
  // Shopify admin yields variant: null and the cards fall back to Instagram.
  return {presentations: await loadPresentations(context.storefront, context.env)};
}

export default function Homepage() {
  const {presentations} = useLoaderData<typeof loader>();

  return (
    <div className="biothree">
      <Hero />

      {/* Benefits — framed as benefits of the same single formula */}
      <section className="bg-cream/50">
        <div className="bt-container bt-section">
          <Reveal>
            <h2 className="bt-h2 max-w-[700px] text-ink">{benefits.title}</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {benefits.cards.map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08} className="h-full">
                <BenefitCard
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  index={i}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Product — one formula, two presentations */}
      <section className="bt-section-divided">
        <div className="bt-container bt-section">
          <Reveal>
            <div className="flex flex-col items-start gap-3">
              <SectionLabel>{productPreview.eyebrow}</SectionLabel>
              <h2 className="bt-h2 max-w-[700px] text-ink">
                {productPreview.title}
              </h2>
              <p className="bt-lead max-w-[560px] text-muted">
                {productPreview.subtitle}
              </p>
            </div>
          </Reveal>
          <div className="mt-8">
            <ProductGrid presentations={presentations} />
          </div>
        </div>
      </section>

      <HowItWorks />

      <ScienceTeaser />

      {/* FAQ preview */}
      <section className="bt-section-divided">
        <div className="bt-container-narrow bt-section">
          <Reveal>
            <div className="flex flex-col items-start gap-3">
              <SectionLabel>Preguntas</SectionLabel>
              <h2 className="bt-h2 text-ink">{faqPreview.title}</h2>
            </div>
          </Reveal>
          <div className="mt-8">
            <FAQAccordion items={faqs.slice(0, 4)} />
          </div>
          <div className="mt-6">
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
