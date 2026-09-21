import type {Rollup} from 'vite';

// React Router already ignores the "use client" directive warning in this
// non-RSC build. Rollup first tries to locate that directive in Framer Motion's
// sourcemap and emits this secondary warning at offset 0. Keep other sourcemap
// diagnostics visible, including ones from application code or other packages.
export const onBuildWarning: Rollup.WarningHandlerWithDefault = (
  warning,
  defaultHandler,
) => {
  const id = warning.id?.replace(/\\/g, '/');
  if (
    warning.code === 'SOURCEMAP_ERROR' &&
    warning.pos === 0 &&
    warning.loc?.line === 1 &&
    warning.loc.column === 0 &&
    /(?:^|\/)node_modules\/framer-motion\/dist\/es\//.test(id ?? '') &&
    warning.message.endsWith(
      "Error when using sourcemap for reporting an error: Can't resolve original location of error.",
    )
  ) {
    return;
  }

  defaultHandler(warning);
};
