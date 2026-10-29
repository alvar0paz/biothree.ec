import {useEffect, useId, useRef} from 'react';
import {useMeasurement} from './Measurement';
import type {Commerce} from '~/lib/measurement';
import {type FetcherWithComponents} from 'react-router';
import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';

export type AddToCartResult = {
  cart?: {id?: string} | null;
  errors?: unknown[];
  warnings?: unknown[];
};

export function getAddToCartState(
  state: string,
  result: AddToCartResult | undefined,
) {
  if (state !== 'idle') return 'pending';
  if (!result) return 'idle';
  if (result.errors?.length || !result.cart?.id) return 'error';
  if (result.warnings?.length) return 'warning';
  return 'success';
}

export function AddToCartFeedback({
  fetcher,
  children,
  className,
  disabled,
  onSuccess,
  onTrackedSuccess,
}: {
  fetcher: Pick<FetcherWithComponents<AddToCartResult>, 'state' | 'data'>;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onTrackedSuccess?: () => void;
}) {
  const id = useId();
  const submitted = useRef(false);
  const status = getAddToCartState(fetcher.state, fetcher.data);
  useEffect(() => {
    if (fetcher.state !== 'idle') {
      submitted.current = true;
    } else if (submitted.current) {
      submitted.current = false;
      if (status === 'success') onTrackedSuccess?.();
      if (status === 'success' || status === 'warning') onSuccess?.();
    }
  }, [fetcher.state, status, onSuccess, onTrackedSuccess]);

  return (
    <>
      <button
        type="submit"
        className={className}
        disabled={Boolean(disabled) || status === 'pending'}
        aria-busy={status === 'pending'}
        aria-describedby={id}
      >
        {status === 'pending'
          ? 'Agregando…'
          : status === 'error'
            ? 'Reintentar'
            : children}
      </button>
      <p
        id={id}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`bt-note text-muted ${status === 'idle' || status === 'pending' ? 'sr-only' : 'mt-3'}`}
      >
        {status === 'pending'
          ? 'Agregando al carrito…'
          : status === 'success'
            ? 'Agregado al carrito.'
            : status === 'error'
              ? 'No se pudo agregar el producto. Revisa tu conexión y vuelve a intentarlo.'
              : status === 'warning'
                ? 'Shopify ajustó tu pedido. Revisa la cantidad y disponibilidad en el carrito.'
                : ''}
      </p>
    </>
  );
}

export function AddToCartButton({
  analytics,
  measurement,
  children,
  className,
  disabled,
  lines,
  onSuccess,
}: {
  analytics?: unknown;
  measurement?: Commerce;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onSuccess?: () => void;
}) {
  const track = useMeasurement();
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher: FetcherWithComponents<AddToCartResult>) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <AddToCartFeedback
            fetcher={fetcher}
            className={className}
            disabled={disabled}
            onSuccess={onSuccess}
            onTrackedSuccess={() => {
              // Only confirmed, unadjusted additions are measured. Failed requests
              // and Shopify warning adjustments never count as a successful add.
              if (measurement) {
                track('add_to_cart', measurement, crypto.randomUUID());
                return;
              }
              for (const line of lines) {
                const variant = line.selectedVariant as {price?: {amount: string; currencyCode: string}} | undefined;
                const price = variant?.price;
                if (!price || !line.quantity) continue;
                track('add_to_cart', {currency: price.currencyCode, value: Math.round(Number(price.amount) * line.quantity * 100) / 100,
                  items: [{item_id: line.merchandiseId.split('/').pop()!, price: Number(price.amount), quantity: line.quantity}]}, crypto.randomUUID());
              }
            }}
          >
            {children}
          </AddToCartFeedback>
        </>
      )}
    </CartForm>
  );
}
