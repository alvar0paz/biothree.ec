import {motion} from 'framer-motion';
import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {ASSETS, hero, INSTAGRAM_URL} from '~/data/copy';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bt-container bt-hero grid items-center gap-10 md:grid-cols-2 md:gap-8">
        {/* Copy */}
        <div className="order-1 flex flex-col items-start gap-5">
          <SectionLabel>{hero.eyebrow}</SectionLabel>
          <h1 className="bt-h1 max-w-[780px] text-ink">{hero.title}</h1>
          <p className="bt-lead max-w-[520px] text-muted">{hero.subtitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Button href={INSTAGRAM_URL} variant="primary" size="lg">
              {hero.primaryCta}
            </Button>
            <Button href="#como-funciona" variant="secondary" size="lg">
              {hero.secondaryCta}
            </Button>
          </div>
        </div>

        {/* Floating product composition */}
        <div className="order-2 flex justify-center md:justify-end">
          <motion.img
            src={ASSETS.probioticCells}
            alt=""
            aria-hidden="true"
            className="w-60 max-w-full select-none sm:w-72 lg:w-[400px]"
            animate={{y: [0, -6, 0]}}
            transition={{duration: 5, repeat: Infinity, ease: 'easeInOut'}}
          />
        </div>
      </div>
    </section>
  );
}
