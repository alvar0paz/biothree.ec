import {createHmac} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {computeShopifyHmac, timingSafeEqual, verifyShopifyWebhookHmac} from './shopify-webhook';

describe('verifyShopifyWebhookHmac', () => {
  const secret = 'shpss_test_secret';
  const body = '{"id":6123456789012,"financial_status":"pending"}';

  it('accepts a signature computed with the same secret', async () => {
    const signature = await computeShopifyHmac(body, secret);
    expect(await verifyShopifyWebhookHmac(body, signature, secret)).toBe(true);
  });

  it('matches Node crypto, which is what Shopify\'s docs use as reference', async () => {
    // The production code uses Web Crypto (Oxygen has no node:crypto); this
    // pins it to the reference implementation, unicode body included.
    const unicodeBody = '{"name":"#1001","note":"Envío a Quito — señora Peña"}';
    for (const sample of [body, unicodeBody, '']) {
      const expected = createHmac('sha256', secret).update(sample, 'utf8').digest('base64');
      expect(await computeShopifyHmac(sample, secret)).toBe(expected);
    }
  });

  it('rejects a tampered body, wrong secret, or missing header', async () => {
    const signature = await computeShopifyHmac(body, secret);
    expect(await verifyShopifyWebhookHmac(body + ' ', signature, secret)).toBe(false);
    expect(await verifyShopifyWebhookHmac(body, signature, 'other')).toBe(false);
    expect(await verifyShopifyWebhookHmac(body, null, secret)).toBe(false);
    expect(await verifyShopifyWebhookHmac(body, signature, undefined)).toBe(false);
  });
});

describe('timingSafeEqual', () => {
  it('compares by value and length', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });
});
