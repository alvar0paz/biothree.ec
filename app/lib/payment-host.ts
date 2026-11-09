/** Both hostnames serve the same Oxygen deployment and Shopify order records. */
export const PAYMENT_ADMIN_HOST = 'deuna.biothree.ec';
export const PAYMENT_ADMIN_ORIGIN = `https://${PAYMENT_ADMIN_HOST}`;
const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex',
  'Referrer-Policy': 'no-referrer',
};

export function paymentHostResponse(request: Request): Response | null {
  const url = new URL(request.url);
  const adminPath = /^\/admin\/pagos(?:\/|\.data$|$)/.test(url.pathname);
  const read = request.method === 'GET' || request.method === 'HEAD';
  if (['biothree.ec', 'www.biothree.ec'].includes(url.hostname) && adminPath) {
    // Never forward a submitted password/action body across origins.
    return read
      ? new Response(null, {
          status: 302,
          headers: {
            ...privateHeaders,
            Location: `${PAYMENT_ADMIN_ORIGIN}${url.pathname}${url.search}`,
          },
        })
      : new Response('Abre deuna.biothree.ec para revisar pagos.', {
          status: 403,
          headers: privateHeaders,
        });
  }
  if (url.hostname !== PAYMENT_ADMIN_HOST) return null;
  if (url.pathname === '/robots.txt')
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: {...privateHeaders, 'Content-Type': 'text/plain'},
    });
  if (url.pathname === '/' && read)
    return new Response(null, {
      status: 302,
      headers: {...privateHeaders, Location: '/admin/pagos'},
    });
  // Assets and React Router's manifest carry code, never order/receipt data.
  if (
    adminPath ||
    (read &&
      (/^\/assets\//.test(url.pathname) ||
        ['/favicon.ico', '/__manifest'].includes(url.pathname)))
  )
    return null;
  return new Response('Página no disponible en el portal de pagos.', {
    status: 404,
    headers: privateHeaders,
  });
}
