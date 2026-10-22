import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {getProductPresentation} from '~/lib/product-presentation';

/** Keep current local packaging consistent through product, cart and checkout. */
export function PresentationImage({
  handle,
  selectedOptions,
  image,
  size,
  className,
}: {
  handle: string;
  selectedOptions: ReadonlyArray<{name: string; value: string}>;
  image?: Omit<NonNullable<ProductVariantFragment['image']>, '__typename'> | null;
  size: number;
  className?: string;
}) {
  const presentation = getProductPresentation(handle, selectedOptions);
  if (presentation) {
    return (
      <img
        src={presentation.image}
        alt={`Frente del empaque de ${presentation.name}. ${presentation.format}.`}
        width={size}
        height={size}
        loading="lazy"
        className={`object-contain ${className ?? ''}`}
      />
    );
  }
  return image ? (
    <Image
      data={image}
      alt={image.altText || 'Producto'}
      aspectRatio="1/1"
      width={size}
      height={size}
      loading="lazy"
      className={className}
    />
  ) : null;
}
