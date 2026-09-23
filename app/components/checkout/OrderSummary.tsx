import {Image, Money} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CheckoutQuote} from '~/lib/shopify-checkout';

type MoneyLike = {amount: string; currencyCode: string};

function isZero(money: MoneyLike) {
  return Number(money.amount) === 0;
}

/** <Money> wants the Storefront enum type; the Admin API hands us a string. */
function money(value: MoneyLike) {
  return value as {amount: string; currencyCode: 'USD'};
}

function Row({
  label,
  children,
  strong = false,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        strong ? 'border-t border-line pt-3 text-ink' : 'text-muted'
      }`}
    >
      <dt className={strong ? 'font-medium' : 'bt-note'}>{label}</dt>
      <dd className={strong ? 'bt-price' : 'bt-note tabular-nums text-ink'}>{children}</dd>
    </div>
  );
}

/**
 * What the customer is paying for, next to the checkout form. Lines come
 * from the Storefront cart; the totals from Shopify's draft-order quote once
 * an address is known, and from the cart subtotal before that.
 */
export function OrderSummary({
  cart,
  quote,
}: {
  cart: CartApiQueryFragment;
  quote: CheckoutQuote | null;
}) {
  const lines = cart.lines.nodes;
  const codes = (cart.discountCodes ?? [])
    .filter((discount) => discount.applicable)
    .map((discount) => discount.code);

  return (
    <div className="rounded-card border border-line bg-surface p-6">
      <h2 className="bt-eyebrow font-mono text-xs text-muted">Tu pedido</h2>
      <ul className="mt-4 flex list-none flex-col gap-4 p-0">
        {lines.map((line) => {
          const {merchandise} = line;
          const options = merchandise.selectedOptions
            .filter((option) => option.value !== 'Default Title')
            .map((option) => option.value)
            .join(' · ');
          return (
            <li key={line.id} className="flex items-start gap-4">
              {merchandise.image && (
                <Image
                  alt={merchandise.title}
                  aspectRatio="1/1"
                  data={merchandise.image}
                  height={64}
                  width={64}
                  loading="lazy"
                  className="rounded-control border border-line/70 bg-cream/40"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="bt-p font-medium leading-snug text-ink">
                  {merchandise.product.title}
                </p>
                <p className="bt-note text-muted">
                  {options ? `${options} · ` : ''}Cantidad: {line.quantity}
                </p>
              </div>
              <span className="bt-note tabular-nums text-ink">
                <Money as="span" data={line.cost.totalAmount} />
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-6 flex flex-col gap-2 border-t border-line pt-4">
        {quote ? (
          <>
            <Row label="Subtotal">
              <Money as="span" data={money(quote.subtotal)} />
            </Row>
            {!isZero(quote.discounts) && (
              <Row label={codes.length ? `Descuento (${codes.join(', ')})` : 'Descuento'}>
                −<Money as="span" data={money(quote.discounts)} />
              </Row>
            )}
            <Row label={quote.shippingLine ? `Envío · ${quote.shippingLine.title}` : 'Envío'}>
              {isZero(quote.shipping) ? 'Gratis' : <Money as="span" data={money(quote.shipping)} />}
            </Row>
            {quote.taxLines.length ? (
              quote.taxLines.map((tax) => (
                <Row
                  key={`${tax.title}-${tax.rate}`}
                  label={`${tax.title === 'VAT' ? 'IVA' : tax.title} ${Math.round(tax.rate * 100)}%`}
                >
                  <Money as="span" data={money(tax.amount)} />
                </Row>
              ))
            ) : (
              <Row label="Impuestos">
                <Money as="span" data={money(quote.tax)} />
              </Row>
            )}
            <Row label="Total" strong>
              <Money as="span" data={money(quote.total)} />
            </Row>
          </>
        ) : (
          <>
            <Row label="Subtotal">
              <Money as="span" data={cart.cost.subtotalAmount} />
            </Row>
            {codes.length > 0 && (
              <Row label="Código aplicado">
                <code className="text-sm">{codes.join(', ')}</code>
              </Row>
            )}
            <p className="bt-note pt-1 text-muted">
              El envío y el IVA se calculan con tu dirección en el siguiente
              paso.
            </p>
          </>
        )}
      </dl>
    </div>
  );
}
