import {describe, expect, it} from 'vitest';
import {getProductPresentation} from './product-presentation';

describe('current packaging selection', () => {
  it('selects each presentation from its option, regardless of option order', () => {
    for (const [value, count] of [
      ['Tabletas', '42'],
      ['Sobres', '21'],
    ]) {
      const presentation = getProductPresentation('biothree', [
        {name: 'Otra opción', value: 'Tabletas'},
        {name: 'Presentación', value},
      ]);
      expect(presentation?.format).toContain(count);
      expect(presentation?.image).toContain('empaque-actual');
    }
  });
  it('does not substitute a package for another product or an unknown variant', () => {
    expect(
      getProductPresentation('another-product', [
        {name: 'Presentación', value: 'Tabletas'},
      ]),
    ).toBeUndefined();
    expect(
      getProductPresentation('biothree', [
        {name: 'Presentación', value: 'Otro'},
      ]),
    ).toBeUndefined();
    expect(getProductPresentation('biothree', [])).toBeUndefined();
  });
});
