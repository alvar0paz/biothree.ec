import {useEffect, useRef} from 'react';
import {useNonce} from '@shopify/hydrogen';
type Turnstile = {
  render: (
    container: HTMLElement,
    options: {sitekey: string; action: string},
  ) => string;
  remove: (id: string) => void;
};
export function PaymentChallenge({
  sitekey,
  action,
  resetKey,
}: {
  sitekey?: string;
  action: string;
  resetKey?: unknown;
}) {
  const container = useRef<HTMLDivElement>(null);
  const nonce = useNonce();
  useEffect(() => {
    if (!sitekey) return;
    const api = () => (window as unknown as {turnstile?: Turnstile}).turnstile;
    let id: string | undefined;
    let cancelled = false;
    const render = () => {
      if (!cancelled && container.current && api() && !id)
        id = api()!.render(container.current, {sitekey, action});
    };
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-payment-challenge]',
    );
    if (!script) {
      script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.nonce = nonce ?? '';
      script.dataset.paymentChallenge = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);
    render();
    return () => {
      cancelled = true;
      script?.removeEventListener('load', render);
      if (id) api()?.remove(id);
    };
  }, [sitekey, action, nonce, resetKey]);
  return <div ref={container} />;
}
