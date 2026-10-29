import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router';
import {useAnalytics, useNonce} from '@shopify/hydrogen';
import {GA4_ID, META_PIXEL_ID, CONSENT_KEY, readConsent, safePage, metaPageAllowed,
  type Consent, type Commerce, type Purchase} from '~/lib/measurement';

type EventName = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase';
type EventData = Commerce | Purchase;
type Track = (name: EventName, data: EventData, key: string) => void;
const Tracking = createContext<Track>(() => {});
export function useMeasurement() { return useContext(Tracking); }
type Fbq = ((...args: unknown[]) => void) & {queue: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded: boolean; version: string; push?: Fbq};
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const metaNames = {view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase'};
const denied = {analytics: false, marketing: false, expires: 0};

function script(id: string, src: string, nonce?: string) {
  if (document.getElementById(id)) return;
  const element = document.createElement('script');
  element.id = id; element.async = true; element.src = src;
  if (nonce) element.nonce = nonce;
  document.head.appendChild(element);
}

export function Measurement({children}: {children: React.ReactNode}) {
  const [consent, setConsent] = useState<Consent>(denied);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [options, setOptions] = useState(denied);
  const location = useLocation();
  const nonce = useNonce();
  const {customerPrivacy} = useAnalytics();
  const sent = useRef(new Set<string>());
  const googleStarted = useRef(false);
  const metaStarted = useRef(false);


  useEffect(() => {
    let stored: Consent | null = null;
    try { stored = readConsent(localStorage); } catch { /* No storage. */ }
    setConsent(stored || denied); setOptions(stored || denied); setOpen(!stored); setLoaded(true);
    const show = () => setOpen(true);
    window.addEventListener('biothree:privacy', show);
    return () => window.removeEventListener('biothree:privacy', show);
  }, []);

  const choose = (analytics: boolean, marketing: boolean) => {
    const next = {analytics, marketing, expires: Date.now() + 180 * 86400000};
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch { /* Session-only choice. */ }
    // Reload after revocation removes scripts and their listeners, not only future calls.
    const revoked = (consent.analytics && !analytics) || (consent.marketing && !marketing);
    setConsent(next); setOptions(next); setOpen(false);
    customerPrivacy?.setTrackingConsent({analytics, marketing, preferences: true, sale_of_data: false}, () => {});
    if (revoked) {
      window.gtag?.('consent', 'update', {analytics_storage: analytics ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      window.fbq?.('consent', 'revoke');
      window.location.reload();
    }
  };

  const ready = useCallback(() => {
    // Preview/local environments must not contaminate the production properties.
    if (!loaded || !['biothree.ec', 'www.biothree.ec'].includes(window.location.hostname)) return {ga: false, meta: false};
    const page = safePage(window.location.href);
    if (!page) return {ga: false, meta: false};
    const ga = consent.analytics;
    const meta = consent.marketing && metaPageAllowed(window.location.href, document.referrer);
    if (ga && !googleStarted.current) {
      window.dataLayer = window.dataLayer || [];
      // Google tag's queue requires an Arguments object, not a plain array.
      // eslint-disable-next-line prefer-rest-params
      window.gtag = function () { window.dataLayer!.push(arguments); };
      window.gtag('consent', 'default', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      window.gtag('set', {send_page_view: false, page_referrer: '', page_title: 'BIO-THREE Ecuador'});
      window.gtag('js', new Date());
      window.gtag('config', GA4_ID, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: page, page_referrer: '', page_title: 'BIO-THREE Ecuador'});
      script('biothree-ga4', `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, nonce);
      googleStarted.current = true;
    }
    if (meta && !metaStarted.current) {
      if (!window.fbq) {
        const queue = function (...args: unknown[]) { if (queue.callMethod) queue.callMethod(...args); else queue.queue.push(args); } as Fbq;
        queue.queue = []; queue.loaded = true; queue.version = '2.0'; queue.push = queue;
        window.fbq = queue; window._fbq = queue;
      }
      window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
      window.fbq('init', META_PIXEL_ID);
      window.fbq('consent', 'grant');
      script('biothree-meta', 'https://connect.facebook.net/en_US/fbevents.js', nonce);
      metaStarted.current = true;
    }
    return {ga, meta};
  }, [consent.analytics, consent.marketing, loaded, nonce]);

  const track = useCallback<Track>((name, data, key) => {
    const destinations = ready();
    const page = safePage(window.location.href);
    for (const destination of ['ga', 'meta'] as const) {
      if (!destinations[destination]) continue;
      const eventKey = `${destination}:${name}:${key}`;
      const persistentKey = `biothree:sent:${eventKey}`;
      if (sent.current.has(eventKey)) continue;
      if (name === 'purchase') {
        try { if (localStorage.getItem(persistentKey)) continue; } catch { /* Memory dedup still works. */ }
      }
      sent.current.add(eventKey);
      if (destination === 'ga') {
        const purchase = name === 'purchase' ? data as Purchase : null;
        window.gtag?.('event', name, {send_to: GA4_ID, currency: data.currency, value: data.value,
          items: data.items.map(item => ({item_id: item.item_id, quantity: item.quantity, ...(item.price !== undefined ? {price: item.price} : {})})),
          ...(purchase ? {transaction_id: purchase.transaction_id, tax: purchase.tax, shipping: purchase.shipping} : {}),
          page_location: page, page_referrer: '', page_title: 'BIO-THREE Ecuador'});
      } else {
        // No customer fields, product names, condition data or custom health parameters.
        window.fbq?.('trackSingle', META_PIXEL_ID, metaNames[name], {
          currency: data.currency, value: name === 'purchase' ? (data as Purchase).total : data.value,
        }, {eventID: key});
      }
      if (name === 'purchase') {
        try { localStorage.setItem(persistentKey, '1'); } catch { /* Platform IDs also deduplicate. */ }
      }
    }
  }, [ready]);

  useEffect(() => {
    const destinations = ready();
    const page = safePage(window.location.href);
    if (!page) return;
    const key = `${location.key}:${page}`;
    if (destinations.ga && !sent.current.has(`ga:page:${key}`)) {
      sent.current.add(`ga:page:${key}`);
      window.gtag?.('event', 'page_view', {send_to: GA4_ID, page_location: page, page_referrer: '', page_title: 'BIO-THREE Ecuador'});
    }
    if (destinations.meta && !sent.current.has(`meta:page:${key}`)) {
      sent.current.add(`meta:page:${key}`);
      window.fbq?.('trackSingle', META_PIXEL_ID, 'PageView');
    }
  }, [ready, location.key, location.pathname, location.search]);

  return <Tracking.Provider value={track}>
    {children}
    {loaded && open && <section role="dialog" aria-modal="false" aria-label="Preferencias de privacidad" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-line bg-white p-5 text-ink shadow-xl">
      <h2 className="text-lg font-semibold">Tu privacidad</h2>
      <p className="mt-2 text-sm">Con tu permiso, usamos Google Analytics para medir visitas y compras, y Meta para medir publicidad. Puedes cambiar tu elección en el pie de página. No enviamos tus datos de contacto ni información de salud.</p>
      <a className="text-sm underline" href="/privacidad-medicion">Cómo usamos estos datos</a>
      <div className="my-3 flex flex-wrap gap-4 text-sm">
        <label><input type="checkbox" checked={options.analytics} onChange={e => setOptions({...options, analytics: e.target.checked})} /> Analítica (Google)</label>
        <label><input type="checkbox" checked={options.marketing} onChange={e => setOptions({...options, marketing: e.target.checked})} /> Publicidad (Meta)</label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded border border-line px-3 py-2 text-sm" onClick={() => choose(false, false)}>Rechazar opcionales</button>
        <button type="button" className="rounded border border-line px-3 py-2 text-sm" onClick={() => choose(options.analytics, options.marketing)}>Guardar elección</button>
        <button type="button" className="rounded bg-ink px-3 py-2 text-sm text-white" onClick={() => choose(true, true)}>Aceptar todas</button>
      </div>
    </section>}
  </Tracking.Provider>;
}

export function CommerceView({name, data, eventKey}: {name: EventName; data: EventData; eventKey: string}) {
  const track = useContext(Tracking);
  const location = useLocation();
  const serialized = JSON.stringify(data);
  useEffect(() => {
    track(name, JSON.parse(serialized) as EventData, name === 'purchase' ? eventKey : `${location.key}:${eventKey}`);
  }, [name, serialized, eventKey, track, location.key]);
  return null;
}
