import {useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {Button} from './Button';
import {SectionLabel} from './SectionLabel';
import {hero, heroBacteria, INSTAGRAM_URL} from '~/data/copy';

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
        </div>

        {/* Floating, cycling product composition */}
        <div className="order-2 flex justify-center md:justify-end">
          <motion.div
            className="relative flex h-60 w-60 items-center justify-center sm:h-72 sm:w-72 lg:h-[400px] lg:w-[400px]"
            animate={{y: [0, -6, 0]}}
            transition={{duration: 5, repeat: Infinity, ease: 'easeInOut'}}
          >
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
