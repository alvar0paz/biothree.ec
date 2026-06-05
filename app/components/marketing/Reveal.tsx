import {motion} from 'framer-motion';
import type {ReactNode} from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

// Gentle fade + small rise when the element scrolls into view.
export function Reveal({children, className, delay = 0}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{opacity: 0, y: 12}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-60px'}}
      transition={{duration: 0.5, ease: 'easeOut', delay}}
    >
      {children}
    </motion.div>
  );
}
