import {describe, expect, it, vi} from 'vitest';
import type {Rollup} from 'vite';
import {onBuildWarning} from './vite-warnings';

const directiveWarning: Rollup.RollupLog = {
  code: 'SOURCEMAP_ERROR',
  id: '/project/node_modules/framer-motion/dist/es/motion/index.mjs',
  pos: 0,
  loc: {line: 1, column: 0},
  message:
    "Error when using sourcemap for reporting an error: Can't resolve original location of error.",
};

describe('build warning handling', () => {
  it.each([
    'motion/index.mjs',
    'components/AnimatePresence/index.mjs',
    'utils/reduced-motion/use-reduced-motion.mjs',
  ])('filters the known Framer Motion directive diagnostic in %s', (file) => {
    const defaultHandler = vi.fn();
    onBuildWarning(
      {
        ...directiveWarning,
        id: `/project/node_modules/framer-motion/dist/es/${file}`,
        message: `node_modules/framer-motion/dist/es/${file} (1:0): ${directiveWarning.message}`,
      },
      defaultHandler,
    );
    expect(defaultHandler).not.toHaveBeenCalled();
  });

  it('handles Windows dependency paths', () => {
    const defaultHandler = vi.fn();
    onBuildWarning(
      {...directiveWarning, id: directiveWarning.id!.replace(/\//g, '\\')},
      defaultHandler,
    );
    expect(defaultHandler).not.toHaveBeenCalled();
  });

  it.each([
    {id: '/project/app/components/marketing/Hero.tsx'},
    {id: '/project/node_modules/another-package/index.mjs'},
    {pos: 20, loc: {line: 2, column: 0}},
    {pos: undefined},
    {loc: undefined},
    {message: 'A different sourcemap failure'},
    {code: 'UNRESOLVED_IMPORT'},
  ])('forwards unrelated diagnostics unchanged: %j', (overrides) => {
    const warning = {...directiveWarning, ...overrides};
    const defaultHandler = vi.fn();
    onBuildWarning(warning, defaultHandler);
    expect(defaultHandler).toHaveBeenCalledExactlyOnceWith(warning);
  });
});
