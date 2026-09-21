import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {AddToCartFeedback, getAddToCartState} from './AddToCartButton';

const success = {cart: {id: 'gid://shopify/Cart/test'}, errors: []};

describe('Add-to-cart response feedback', () => {
  it('never confirms a previous response during submission or revalidation', () => {
    expect(getAddToCartState('submitting', success)).toBe('pending');
    expect(getAddToCartState('loading', success)).toBe('pending');
    expect(getAddToCartState('idle', undefined)).toBe('idle');
    expect(getAddToCartState('idle', success)).toBe('success');
  });
  it('requires a confirmed cart without errors and distinguishes inventory warnings', () => {
    expect(getAddToCartState('idle', {errors: []})).toBe('error');
    expect(
      getAddToCartState('idle', {...success, errors: [{message: 'Sold out'}]}),
    ).toBe('error');
    expect(
      getAddToCartState('idle', {
        ...success,
        warnings: [{code: 'MERCHANDISE_NOT_ENOUGH_STOCK'}],
      }),
    ).toBe('warning');
  });
  it('disables a pending button even when its caller explicitly passes disabled=false', () => {
    const html = renderToStaticMarkup(
      createElement(
        AddToCartFeedback,
        {
          fetcher: {state: 'submitting', data: success},
          disabled: false,
        },
        'Agregar al carrito',
      ),
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Agregando…');
    expect(html).not.toContain('Agregado al carrito.');
  });
  it('announces errors with an enabled retry action', () => {
    const html = renderToStaticMarkup(
      createElement(
        AddToCartFeedback,
        {
          fetcher: {
            state: 'idle',
            data: {cart: null, errors: [{message: 'Unavailable'}]},
          },
        },
        'Agregar al carrito',
      ),
    );
    expect(html).toContain('Reintentar');
    expect(html).toContain('No se pudo agregar el producto.');
    expect(html).toContain('role="status"');
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('Agregado al carrito.');
  });
});
