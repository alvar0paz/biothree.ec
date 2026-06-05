import {motion} from 'framer-motion';
import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {ASSETS, hero} from '~/data/copy';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-8 md:py-24 lg:py-28">
        {/* Copy */}
        <div className="order-1 flex flex-col items-start gap-6">
          <SectionLabel>{hero.eyebrow}</SectionLabel>
          <h1 className="font-tight text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-muted">
            {hero.subtitle}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button href="/productos" variant="primary" size="lg">
              {hero.primaryCta}
            </Button>
            <Button href="#como-funciona" variant="secondary" size="lg">
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

        {/* Floating visual */}
        <div className="order-2 flex justify-center md:justify-end">
          <motion.img
            src={ASSETS.probioticCells}
            alt=""
            aria-hidden="true"
            className="w-64 max-w-full select-none sm:w-80 lg:w-[420px]"
            animate={{y: [0, -6, 0]}}
            transition={{duration: 5, repeat: Infinity, ease: 'easeInOut'}}
          />
        </div>
      </div>
    </section>
  );
}
