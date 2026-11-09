import {afterEach, describe, expect, it, vi} from 'vitest';
import {
  deunaReady,
  confirmationDraft,
  sameOrigin,
  secretMatches,
  validateReceipt,
  reviewPayment,
  findCustomerOrder,
  type DeunaEnv,
  type Review,
} from './deuna.server';
import {handleOrderCreated, startPayphonePayment} from './payphone-flow';
import {normalizeOrder} from './shopify-admin';
const env = {
  PUBLIC_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_ADMIN_API_TOKEN: 'test',
  SESSION_SECRET: 'test',
  PAYPHONE_API_TOKEN: 'test',
} as DeunaEnv;
const raw = {
  id: 'gid://shopify/Order/123',
  legacyResourceId: '123',
  name: '#1001',
  email: 'buyer@example.com',
  displayFinancialStatus: 'PENDING',
  taxesIncluded: true,
  totalPriceSet: {shopMoney: {amount: '20.00', currencyCode: 'USD'}},
  totalTaxSet: {shopMoney: {amount: '0'}},
  totalOutstandingSet: {shopMoney: {amount: '20.00', currencyCode: 'USD'}},
  taxLines: [],
  tags: ['deuna-checkout'],
  payphoneLink: null,
  payphoneClientTx: null,
};
function backend(
  options: {
    changedAmount?: boolean;
    stale?: boolean;
  } = {},
) {
  let state: Review = {
    status: 'review',
    receipt: 'deuna/123/abc',
    mime: 'image/png',
    uploadedAt: '2026-11-09',
    amount: '20.00',
    currency: 'USD',
  };
  let digest = 'v1';
  let paid = false;
  let paidCalls = 0;
  let emailCalls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      if (String(url).includes('resend.com')) {
        emailCalls++;
        throw new Error('No email service should be called');
      }
      const {query, variables} = JSON.parse(String(init.body)) as {
        query: string;
        variables: {metafields: {compareDigest: string; value: string}[]};
      };
      if (query.includes('query PaymentOrder'))
        return Response.json({
          data: {
            order: {
              ...raw,
              displayFinancialStatus: paid ? 'PAID' : 'PENDING',
              totalOutstandingSet: {
                shopMoney: {
                  amount: options.changedAmount ? '25.00' : '20.00',
                  currencyCode: 'USD',
                },
              },
            },
          },
        });
      if (query.includes('query DeunaReview'))
        return Response.json({
          data: {
            order: {
              metafield: {
                value: JSON.stringify(state),
                compareDigest: options.stale ? 'other' : digest,
              },
            },
          },
        });
      if (query.includes('mutation SaveDeunaReview')) {
        const field = variables.metafields[0];
        if (field.compareDigest !== digest)
          return Response.json({
            data: {metafieldsSet: {userErrors: [{message: 'conflict'}]}},
          });
        state = JSON.parse(field.value) as Review;
        digest += 'x';
        return Response.json({data: {metafieldsSet: {userErrors: []}}});
      }
      if (query.includes('mutation MarkPaid')) {
        paid = true;
        paidCalls++;
        return Response.json({
          data: {
            orderMarkAsPaid: {
              order: {displayFinancialStatus: 'PAID'},
              userErrors: [],
            },
          },
        });
      }
      throw new Error(query);
    }),
  );
  return {
    get state() {
      return state;
    },
    get digest() {
      return digest;
    },
    get paidCalls() {
      return paidCalls;
    },
    get emailCalls() {
      return emailCalls;
    },
  };
}
afterEach(() => vi.unstubAllGlobals());
describe('Deuna payment boundaries', () => {
  it('stays disabled until the complete private infrastructure is configured', () =>
    expect(deunaReady(env)).toBe(false));
  it('rejects cross-origin and non-POST mutations', () => {
    expect(() =>
      sameOrigin(
        new Request('https://biothree.ec/admin/pagos', {
          method: 'POST',
          headers: {Origin: 'https://evil.test'},
        }),
      ),
    ).toThrow();
    expect(() =>
      sameOrigin(new Request('https://biothree.ec/admin/pagos')),
    ).toThrow();
  });
  it('compares admin secrets without accepting prefixes', async () => {
    expect(await secretMatches('secret', 'secret')).toBe(true);
    expect(await secretMatches('secret1', 'secret')).toBe(false);
  });
  it('rejects active content masquerading as an image and oversized images', async () => {
    await expect(
      validateReceipt(new File(['<svg/>'], 'receipt.png', {type: 'image/png'})),
    ).rejects.toHaveProperty('status', 400);
    await expect(
      validateReceipt(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'receipt.jpg', {
          type: 'image/jpeg',
        }),
      ),
    ).rejects.toHaveProperty('status', 400);
  });
  it('accepts PNG signatures, independently of the user filename', async () => {
    const valid = new File(
      [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
      'anything',
      {type: 'image/png'},
    );
    expect((await validateReceipt(valid)).mime).toBe('image/png');
  });
  it('does not generate PayPhone links for Deuna checkout webhooks', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(
      (
        await handleOrderCreated(
          {id: 123, tags: 'deuna-checkout', financial_status: 'pending'},
          env as never,
        )
      ).status,
    ).toBe('skipped');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('blocks PayPhone retry for a Deuna order', async () => {
    await expect(
      startPayphonePayment(normalizeOrder(raw), env as never, {
        responseUrl: 'https://biothree.ec',
        cancellationUrl: 'https://biothree.ec',
      }),
    ).rejects.toThrow('cannot be paid');
  });
  it('approves the order without sending mail, then records explicit manual sending', async () => {
    const mock = backend();
    expect(await reviewPayment(env, '123', 'approve', '', 'v1')).toEqual({
      emailPending: true,
    });
    expect(mock.paidCalls).toBe(1);
    expect(mock.emailCalls).toBe(0);
    expect(mock.state.status).toBe('approved');
    expect(mock.state.emailSentAt).toBeUndefined();
    await reviewPayment(env, '123', 'email-sent', '', mock.digest);
    expect(mock.state.emailMethod).toBe('manual-gmail');
    expect(mock.state.emailSentAt).toBeTruthy();
    await reviewPayment(env, '123', 'email-sent', '', mock.digest);
    expect(mock.paidCalls).toBe(1);
    expect(mock.emailCalls).toBe(0);
  });
  it('cannot record a confirmation before reviewing payment', async () => {
    const mock = backend();
    await expect(
      reviewPayment(env, '123', 'email-sent', '', mock.digest),
    ).rejects.toHaveProperty('status', 409);
    expect(mock.state.emailSentAt).toBeUndefined();
    expect(mock.paidCalls).toBe(0);
  });
  it('prepares a Gmail draft only after review, preserving recipient and escaping text', () => {
    const mock = backend();
    expect(
      confirmationDraft('info@biostradeglobal.com', raw, mock.state),
    ).toBeNull();
    const draft = confirmationDraft('info@biostradeglobal.com', raw, {
      ...mock.state,
      status: 'approved',
    });
    const params = new URL(draft!.url).searchParams;
    expect(params.get('authuser')).toBe('info@biostradeglobal.com');
    expect(params.get('to')).toBe(raw.email);
    expect(params.get('su')).toContain('#1001');
    expect(params.get('body')).toContain('USD 20.00');
    expect(
      confirmationDraft(
        'info@biostradeglobal.com',
        {...raw, email: null},
        {...mock.state, status: 'approved'},
      ),
    ).toBeNull();
    const rejected = confirmationDraft('info@biostradeglobal.com', raw, {
      ...mock.state,
      status: 'rejected',
      reason: 'Revisar & confirmar #2',
    });
    expect(new URL(rejected!.url).searchParams.get('body')).toContain(
      'Revisar & confirmar #2',
    );
  });
  it('does not mark paid on rejection', async () => {
    const mock = backend();
    await reviewPayment(env, '123', 'reject', 'El importe no coincide.', 'v1');
    expect(mock.paidCalls).toBe(0);
    expect(mock.state.status).toBe('rejected');
  });
  it('refuses stale reviews and changed amounts before financial mutations', async () => {
    let mock = backend({stale: true});
    await expect(
      reviewPayment(env, '123', 'approve', '', 'v1'),
    ).rejects.toHaveProperty('status', 409);
    expect(mock.paidCalls).toBe(0);
    mock = backend({changedAmount: true});
    await expect(
      reviewPayment(env, '123', 'approve', '', 'v1'),
    ).rejects.toHaveProperty('status', 409);
    expect(mock.paidCalls).toBe(0);
  });
  it('requires an exact number/email match and rejects query injection', async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        data: {
          orders: {nodes: [{id: raw.id, name: '#1001', email: raw.email}]},
        },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    expect(
      await findCustomerOrder(env, '1001', 'wrong@example.com'),
    ).toBeNull();
    expect(
      await findCustomerOrder(env, '1001 OR name:*', raw.email),
    ).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
