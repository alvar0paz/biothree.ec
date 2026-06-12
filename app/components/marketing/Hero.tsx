import {Fragment, useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {ASSETS, hero, heroBacteria, INSTAGRAM_URL} from '~/data/copy';

export function Hero() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  // Cycle through every available bacteria illustration. The auto-cycling is
  // plain JS, so prefers-reduced-motion has to be honored manually here.
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroBacteria.length);
    }, 1600);
    return () => clearInterval(id);
  }, [reduceMotion]);

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

          {/* Trust strip — quiet credibility markers under the CTAs. */}
          <p className="bt-trust-strip mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line pt-4">
            {hero.trust.map((item, i) => (
              <Fragment key={item}>
                {i > 0 && (
                  <span aria-hidden="true" className="text-purple/40">
                    ·
                  </span>
                )}
                <span>{item}</span>
              </Fragment>
            ))}
          </p>
        </div>

        {/* Floating, cycling product composition over a soft radial glow. */}
        <div className="order-2 flex justify-center md:justify-end">
          <motion.div
            className="relative flex h-60 w-60 items-center justify-center sm:h-72 sm:w-72 lg:h-[400px] lg:w-[400px]"
            animate={{y: [0, -6, 0]}}
            transition={{duration: 5, repeat: Infinity, ease: 'easeInOut'}}
          >
            <div className="bt-hero-glow" aria-hidden="true" />

            {/* Small decorative drifting cells anchor the composition. The CSS
                animation is disabled by the global reduced-motion rule. */}
            <img
              src={ASSETS.probioticCells}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="bt-drift pointer-events-none absolute -left-8 top-4 hidden w-16 select-none opacity-50 sm:block lg:-left-14 lg:w-20"
            />
            <img
              src={ASSETS.probioticRods}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="bt-drift-slow pointer-events-none absolute -bottom-2 -right-4 hidden w-14 select-none opacity-40 sm:block lg:-right-8 lg:w-16"
            />

            <AnimatePresence mode="wait">
              <motion.img
                key={index}
                src={heroBacteria[index]}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full select-none object-contain"
                initial={{opacity: 0, scale: 0.96}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.98}}
                transition={{duration: 0.4, ease: 'easeInOut'}}
              />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
