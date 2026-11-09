import {describe, expect, it} from 'vitest';
import {paymentHostResponse} from './payment-host';
describe('isolated payment hostname', () => {
  it('opens the dashboard at the subdomain root', () => {
    const response = paymentHostResponse(
      new Request('https://deuna.biothree.ec/'),
    );
    expect(response?.headers.get('Location')).toBe('/admin/pagos');
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store');
  });
  it('routes dashboard documents, data and receipts through authentication', () => {
    for (const path of [
      '/admin/pagos',
      '/admin/pagos.data',
      '/admin/pagos/comprobante/123',
    ]) {
      expect(
        paymentHostResponse(new Request(`https://deuna.biothree.ec${path}`)),
      ).toBeNull();
    }
  });
  it('does not expose checkout or other storefront endpoints on the admin host', () => {
    for (const path of [
      '/checkout',
      '/mi-pedido',
      '/api/webhooks/payphone',
      '/admin/pagos-other',
    ]) {
      expect(
        paymentHostResponse(new Request(`https://deuna.biothree.ec${path}`))
          ?.status,
      ).toBe(404);
    }
  });
  it('redirects admin navigation from the main site but never forwards POST bodies', () => {
    const url = 'https://biothree.ec/admin/pagos';
    expect(paymentHostResponse(new Request(url))?.headers.get('Location')).toBe(
      'https://deuna.biothree.ec/admin/pagos',
    );
    expect(
      paymentHostResponse(new Request(url, {method: 'POST'}))?.status,
    ).toBe(403);
  });
  it('leaves customer checkout untouched and disallows robot indexing', async () => {
    expect(
      paymentHostResponse(new Request('https://biothree.ec/checkout')),
    ).toBeNull();
    expect(
      await paymentHostResponse(
        new Request('https://deuna.biothree.ec/robots.txt'),
      )?.text(),
    ).toContain('Disallow: /');
  });
});
