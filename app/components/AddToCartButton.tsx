import {useEffect, useId, useRef} from 'react';
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
}: {
  fetcher: Pick<FetcherWithComponents<AddToCartResult>, 'state' | 'data'>;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const id = useId();
  const submitted = useRef(false);
  const status = getAddToCartState(fetcher.state, fetcher.data);
  useEffect(() => {
    if (fetcher.state !== 'idle') {
      submitted.current = true;
    } else if (submitted.current) {
      submitted.current = false;
      if (status === 'success' || status === 'warning') onSuccess?.();
    }
  }, [fetcher.state, status, onSuccess]);

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
  children,
  className,
  disabled,
  lines,
  onSuccess,
}: {
  analytics?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  lines: Array<OptimisticCartLineInput>;
  onSuccess?: () => void;
}) {
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
          >
            {children}
          </AddToCartFeedback>
        </>
      )}
    </CartForm>
  );
}
