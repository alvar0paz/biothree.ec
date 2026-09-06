import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {CartForm, Money, type OptimisticCart} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';
import {useFetcher} from 'react-router';
import type {FetcherWithComponents} from 'react-router';
import {buttonClasses} from '~/components/marketing/Button';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

export function CartSummary({cart, layout}: CartSummaryProps) {
  const className =
    layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  return (
    <div aria-labelledby="cart-summary" className={className}>
      <dl className="cart-subtotal flex items-baseline justify-between gap-4">
        <dt className="bt-eyebrow font-mono text-[0.7rem] text-muted">
          Subtotal
        </dt>
        <dd className="bt-h3 text-ink">
          {cart?.cost?.subtotalAmount?.amount ? (
            <Money data={cart?.cost?.subtotalAmount} />
          ) : (
            '-'
          )}
        </dd>
      </dl>
      {/* Shipping and taxes are calculated by Shopify at checkout — saying so
          here prevents the "why did the total change?" drop-off. */}
      <p className="bt-note pb-3 text-muted">
        Envío e impuestos se calculan al finalizar la compra.
      </p>
      <CartDiscounts discountCodes={cart?.discountCodes} layout={layout} />
      {/* Gift cards aren't sold here, so the drawer skips the field. The full
          cart page keeps it for the rare customer who has one. */}
      {layout === 'page' && (
        <CartGiftCard giftCardCodes={cart?.appliedGiftCards} />
      )}
      <CartCheckoutActions checkoutUrl={cart?.checkoutUrl} />
    </div>
  );
}

function CartCheckoutActions({checkoutUrl}: {checkoutUrl?: string}) {
  if (!checkoutUrl) return null;

  return (
    <div className="pt-3">
      {/* checkoutUrl points at Shopify's hosted checkout, which is where the
          payment providers configured in the admin (transferencia, PayPhone…)
          actually appear. Nothing about payment lives in this app. */}
      <a
        href={checkoutUrl}
        target="_self"
        className={buttonClasses({className: 'w-full'})}
      >
        Finalizar compra
      </a>
    </div>
  );
}

function CartDiscounts({
  discountCodes,
  layout,
}: {
  discountCodes?: CartApiQueryFragment['discountCodes'];
  layout: CartLayout;
}) {
  const codes: string[] =
    discountCodes
      ?.filter((discount) => discount.applicable)
      ?.map(({code}) => code) || [];

  const form = (
    <UpdateDiscountForm discountCodes={codes}>
      <div className="flex items-center gap-2 py-2">
        <label htmlFor="cart-discount-code" className="sr-only">
          Código de descuento
        </label>
        <input
          id="cart-discount-code"
          type="text"
          name="discountCode"
          placeholder="Código de descuento"
          autoComplete="off"
          autoCapitalize="characters"
          className="bt-input flex-1"
        />
        <button type="submit" className={buttonClasses({variant: 'secondary'})}>
          Aplicar
        </button>
      </div>
    </UpdateDiscountForm>
  );

  return (
    <div>
      {/* Have existing discount, display it with a remove option */}
      {codes.length > 0 && (
        <dl>
          <div className="flex items-center justify-between gap-4 py-1">
            <dt className="bt-eyebrow font-mono text-[0.7rem] text-muted">
              Descuento
            </dt>
            <UpdateDiscountForm>
              <dd className="cart-discount flex items-center gap-2 !mt-0">
                <code className="text-sm text-ink">{codes.join(', ')}</code>
                <button
                  type="submit"
                  className="text-sm text-muted underline underline-offset-2 hover:text-ink"
                >
                  Quitar
                </button>
              </dd>
            </UpdateDiscountForm>
          </div>
        </dl>
      )}

      {/* In the drawer the input hides behind a one-line disclosure: most
          customers have no code, and the field was crowding the checkout
          button. Open by default once a code is applied. The page has room. */}
      {layout === 'aside' ? (
        <details className="bt-disclosure" open={codes.length > 0}>
          <summary className="bt-note py-1 text-muted hover:text-ink">
            ¿Tienes un código de descuento?
          </summary>
          {form}
        </details>
      ) : (
        form
      )}
    </div>
  );
}

function UpdateDiscountForm({
  discountCodes,
  children,
}: {
  discountCodes?: string[];
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.DiscountCodesUpdate}
      inputs={{
        discountCodes: discountCodes || [],
      }}
    >
      {children}
    </CartForm>
  );
}

function CartGiftCard({
  giftCardCodes,
}: {
  giftCardCodes: CartApiQueryFragment['appliedGiftCards'] | undefined;
}) {
  const appliedGiftCardCodes = useRef<string[]>([]);
  const giftCardCodeInput = useRef<HTMLInputElement>(null);
  const giftCardAddFetcher = useFetcher({key: 'gift-card-add'});

  // Clear the gift card code input after the gift card is added
  useEffect(() => {
    if (giftCardAddFetcher.data) {
      giftCardCodeInput.current!.value = '';
    }
  }, [giftCardAddFetcher.data]);

  function saveAppliedCode(code: string) {
    const formattedCode = code.replace(/\s/g, ''); // Remove spaces
    if (!appliedGiftCardCodes.current.includes(formattedCode)) {
      appliedGiftCardCodes.current.push(formattedCode);
    }
  }

  return (
    <div>
      {/* Display applied gift cards with individual remove buttons */}
      {giftCardCodes && giftCardCodes.length > 0 && (
        <dl>
          <dt className="bt-eyebrow font-mono text-[0.7rem] text-muted">
            Tarjetas de regalo
          </dt>
          {giftCardCodes.map((giftCard) => (
            <RemoveGiftCardForm key={giftCard.id} giftCardId={giftCard.id}>
              <div className="cart-discount flex items-center gap-2">
                <code>***{giftCard.lastCharacters}</code>
                <Money data={giftCard.amountUsed} />
                <button type="submit" className="bt-nav-link text-sm underline">
                  Quitar
                </button>
              </div>
            </RemoveGiftCardForm>
          ))}
        </dl>
      )}

      {/* Show an input to apply a gift card */}
      <UpdateGiftCardForm
        giftCardCodes={appliedGiftCardCodes.current}
        saveAppliedCode={saveAppliedCode}
        fetcherKey="gift-card-add"
      >
        <div className="flex items-center gap-2 py-2">
          <label htmlFor="cart-gift-card-code" className="sr-only">
            Tarjeta de regalo
          </label>
          <input
            id="cart-gift-card-code"
            type="text"
            name="giftCardCode"
            placeholder="Tarjeta de regalo"
            ref={giftCardCodeInput}
            autoComplete="off"
            className="bt-input flex-1"
          />
          <button
            type="submit"
            disabled={giftCardAddFetcher.state !== 'idle'}
            className={buttonClasses({variant: 'secondary'})}
          >
            Aplicar
          </button>
        </div>
      </UpdateGiftCardForm>
    </div>
  );
}

function UpdateGiftCardForm({
  giftCardCodes,
  saveAppliedCode,
  fetcherKey,
  children,
}: {
  giftCardCodes?: string[];
  saveAppliedCode?: (code: string) => void;
  fetcherKey?: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      fetcherKey={fetcherKey}
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesUpdate}
      inputs={{
        giftCardCodes: giftCardCodes || [],
      }}
    >
      {(fetcher: FetcherWithComponents<any>) => {
        const code = fetcher.formData?.get('giftCardCode');
        if (code && saveAppliedCode) {
          saveAppliedCode(code as string);
        }
        return children;
      }}
    </CartForm>
  );
}

function RemoveGiftCardForm({
  giftCardId,
  children,
}: {
  giftCardId: string;
  children: React.ReactNode;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.GiftCardCodesRemove}
      inputs={{
        giftCardCodes: [giftCardId],
      }}
    >
      {children}
    </CartForm>
  );
}
