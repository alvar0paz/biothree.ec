import {beforeEach, describe, expect, it, vi} from 'vitest';
import {loader} from '../routes/pago.confirmado';
import {adminRequest} from '~/lib/shopify-admin';
vi.mock('~/lib/shopify-admin', () => ({adminRequest: vi.fn(), orderGid: (id: string) => `gid://shopify/Order/${id}`}));
vi.mock('~/lib/payphone-flow', () => ({getFlowEnv: () => ({PUBLIC_STORE_DOMAIN: 'test.myshopify.com'})}));

const paid = {legacyResourceId: '123', displayFinancialStatus: 'PAID',
  totalPriceSet: {shopMoney: {amount: '35', currencyCode: 'USD'}}, totalTaxSet: {shopMoney: {amount: '4'}},
  totalShippingPriceSet: {shopMoney: {amount: '3'}},
  lineItems: {nodes: [{quantity: 1, variant: {id: 'gid://shopify/ProductVariant/456'}}], pageInfo: {hasNextPage: false}}};
const args = (receipt: unknown) => ({context: {session: {get: () => receipt}, env: {}}, request: new Request('https://biothree.ec/pago/confirmado'), params: {}}) as unknown as Parameters<typeof loader>[0];
beforeEach(() => vi.resetAllMocks());
describe('receipt loader boundary', () => {
  it.each([undefined, {orderId: '123', expires: 1}, {orderId: 'bad', expires: Date.now()+50000}])('does not query an order without a valid signed receipt', async receipt => {
    const result = await loader(args(receipt));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect(adminRequest).not.toHaveBeenCalled();
  });
  it('reads the server order, returns private non-cacheable measurement and no buyer fields', async () => {
    vi.mocked(adminRequest).mockResolvedValue({order: {...paid, email: 'private@example.com'}});
    const result = await loader(args({orderId: '123', expires: Date.now()+50000}));
    expect(result).not.toBeInstanceOf(Response);
    const body = result as {data: {purchase: {value: number}}; init: {headers: Record<string, string>}};
    expect(body.data.purchase.value).toBe(28);
    expect(body.init.headers['Cache-Control']).toBe('private, no-store');
    expect(JSON.stringify(body.data)).not.toContain('private@example.com');
  });
  it('does not emit a purchase if Shopify reports pending payment', async () => {
    vi.mocked(adminRequest).mockResolvedValue({order: {...paid, displayFinancialStatus: 'PENDING'}});
    const result = await loader(args({orderId: '123', expires: Date.now()+50000}));
    expect((result as {data: {purchase: unknown}}).data.purchase).toBeNull();
  });
  it('keeps the confirmation page available during analytics lookup failure', async () => {
    vi.mocked(adminRequest).mockRejectedValue(new Error('temporary outage'));
    const result = await loader(args({orderId: '123', expires: Date.now()+50000}));
    expect((result as {data: {purchase: unknown}}).data.purchase).toBeNull();
  });
});
