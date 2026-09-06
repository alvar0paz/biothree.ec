// Shopify signs every webhook with HMAC-SHA256 over the raw body using the
// signing secret shown under Settings → Notifications → Webhooks. Verify
// before parsing, and compare in constant time. Uses Web Crypto because this
// runs on Oxygen workers, which have no Node `crypto`.

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Length-then-byte comparison that doesn't short-circuit on the first diff. */
export function timingSafeEqual(a: string, b: string): boolean {
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);
  if (bytesA.length !== bytesB.length) return false;
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

export async function computeShopifyHmac(rawBody: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  return toBase64(new Uint8Array(signature));
}

export async function verifyShopifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null | undefined,
  secret: string | undefined,
): Promise<boolean> {
  if (!hmacHeader || !secret) return false;
  const expected = await computeShopifyHmac(rawBody, secret);
  return timingSafeEqual(expected, hmacHeader.trim());
}
