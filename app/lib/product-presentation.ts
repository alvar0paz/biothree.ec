import {products} from '~/data/products';

/** Match only a known BIO-THREE presentation; never relabel other products. */
export function getProductPresentation(
  handle: string,
  selectedOptions: ReadonlyArray<{name: string; value: string}>,
) {
  if (handle !== 'biothree') return undefined;
  const value = selectedOptions.find(
    (option) => option.name === 'Presentación',
  )?.value;
  return products.find((product) => product.optionValue === value);
}
