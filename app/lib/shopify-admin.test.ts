import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {adminRequest, getAdminAccessToken, resetAdminTokenCache, type AdminEnv} from './shopify-admin';

const env: AdminEnv = {
  PUBLIC_STORE_DOMAIN: 'test.myshopify.com',
  SHOPIFY_CLIENT_ID: 'cid',
  SHOPIFY_CLIENT_SECRET: 'csecret',
};

function mockFetch(opts: {tokens?: string[]; graphqlStatuses?: number[]} = {}) {
  const tokens = [...(opts.tokens ?? ['tok-1', 'tok-2'])];
  const statuses = [...(opts.graphqlStatuses ?? [200])];
  const calls: Array<{url: string; token?: string; body?: string}> = [];
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({url, token: headers['X-Shopify-Access-Token'], body: String(init?.body ?? '')});
    if (url.endsWith('/admin/oauth/access_token')) {
      return Response.json({access_token: tokens.shift() ?? 'tok-x', scope: 'read_orders,write_orders', expires_in: 86399});
    }
    const status = statuses.shift() ?? 200;
    return status === 200
      ? Response.json({data: {shop: {name: 'Bio Three'}}})
      : new Response('{"errors":"[API] Invalid API key or access token"}', {status});
  });
  vi.stubGlobal('fetch', fetchMock);
  return {calls, fetchMock};
}

beforeEach(() => resetAdminTokenCache());
afterEach(() => vi.unstubAllGlobals());

describe('getAdminAccessToken', () => {
  it('exchanges client credentials with the form-encoded grant and caches the result', async () => {
    const {calls} = mockFetch();
    expect(await getAdminAccessToken(env)).toBe('tok-1');
    expect(await getAdminAccessToken(env)).toBe('tok-1');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://test.myshopify.com/admin/oauth/access_token');
    expect(calls[0].body).toBe('grant_type=client_credentials&client_id=cid&client_secret=csecret');
  });

  it('refreshes once the cached token is about to expire', async () => {
    const {calls} = mockFetch();
    vi.useFakeTimers();
    try {
      await getAdminAccessToken(env);
      vi.advanceTimersByTime(86399 * 1000 - 30_000);
      expect(await getAdminAccessToken(env)).toBe('tok-2');
      expect(calls).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps separate tokens per store and client', async () => {
    const {calls} = mockFetch();
    await getAdminAccessToken(env);
    await getAdminAccessToken({...env, PUBLIC_STORE_DOMAIN: 'other.myshopify.com'});
    expect(calls).toHaveLength(2);
  });

  it('uses a static token verbatim when one is configured', async () => {
    const {calls} = mockFetch();
    expect(await getAdminAccessToken({PUBLIC_STORE_DOMAIN: 'x', SHOPIFY_ADMIN_API_TOKEN: 'shpat_static'})).toBe(
      'shpat_static',
    );
    expect(calls).toHaveLength(0);
  });

  it('fails clearly without any credentials', async () => {
    mockFetch();
    await expect(getAdminAccessToken({PUBLIC_STORE_DOMAIN: 'x'})).rejects.toThrow(/SHOPIFY_CLIENT_ID/);
  });
});

describe('adminRequest', () => {
  it('sends the minted token and retries once with a fresh one on 401', async () => {
    const {calls} = mockFetch({graphqlStatuses: [401, 200]});
    const data = await adminRequest<{shop: {name: string}}>(env, '{ shop { name } }');
    expect(data.shop.name).toBe('Bio Three');
    const graphql = calls.filter((call) => call.url.includes('/graphql.json'));
    expect(graphql.map((call) => call.token)).toEqual(['tok-1', 'tok-2']);
  });

  it('does not retry a static token', async () => {
    const {calls} = mockFetch({graphqlStatuses: [401]});
    await expect(
      adminRequest({PUBLIC_STORE_DOMAIN: 'x', SHOPIFY_ADMIN_API_TOKEN: 'shpat'}, '{ shop { name } }'),
    ).rejects.toThrow(/Admin API 401/);
    expect(calls.filter((call) => call.url.includes('/graphql.json'))).toHaveLength(1);
  });
});
