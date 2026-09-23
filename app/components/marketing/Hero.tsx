import {useEffect, useState} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import {Button} from './Button';
import {hero, heroBacteria} from '~/data/copy';

export function Hero() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion !== false) return;

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setIndex((current) => (current + 1) % heroBacteria.length);
    }, 1600);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <section>
      <div className="bt-container bt-hero grid items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <div className="flex flex-col items-start gap-6">
          <h1 className="bt-h1 text-ink">{hero.title}</h1>
          <p className="bt-lead text-muted">{hero.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button href="/productos" size="lg">
              {hero.primaryCta}
            </Button>
            <Button href="#como-funciona" variant="secondary" size="lg">
              {hero.secondaryCta}
            </Button>
          </div>
          {/* The product's spec sheet in three entries; it replaces the
              generic "a · b · c" strip and needs no rule to separate it. */}
          <dl className="bt-facts mt-4">
            {hero.facts.map((fact) => (
              <div key={fact.label} className="bt-fact">
                <dt className="bt-index-label">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="bt-hero-art" aria-hidden="true">
          {reduceMotion ? (
            <img src={heroBacteria[0]} alt="" decoding="async" />
          ) : (
            <motion.div
              className="grid w-full"
              animate={{y: [0, -6, 0]}}
              transition={{duration: 5, repeat: Infinity, ease: 'easeInOut'}}
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.img
                  key={index}
                  src={heroBacteria[index]}
                  alt=""
                  decoding="async"
                  className="select-none"
                  initial={{opacity: 0, scale: 0.96}}
                  animate={{opacity: 1, scale: 1}}
                  exit={{opacity: 0, scale: 0.98}}
                  transition={{duration: 0.4, ease: [0.2, 0.7, 0.3, 1]}}
                />
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
