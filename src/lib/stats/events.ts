import { getCountryByCode, getCountryBySlug } from '@/data/countries';
import { getProvider } from '@/data/providers';
import { isCurrency, isLocale, locales } from '@/i18n/config';
import { dataActivities, usageLevels } from '@/lib/types/trip';

/**
 * What the site counts, and nothing else.
 *
 * The browser sends one small message per thing that happened (`StatEvent`);
 * the server turns it into counters for the day (`countersFor`) and forgets
 * the message. The rules hold for every counter name:
 *
 *  - built only from values this file checks against a known list — a page's
 *    route (never its address), a country code we hold, a provider we list, a
 *    usage level, a currency — so nothing a visitor typed can become a name;
 *  - nothing that tells one visitor from another: no address, no identifier,
 *    no cookie, no time finer than the day. The visitor's country comes from
 *    the host's own header, as a two-letter code, and the address itself is
 *    never read;
 *  - a browser asking not to be followed (Global Privacy Control, or Do Not
 *    Track) is not counted at all, and neither is a robot.
 *
 * Kept on the dashboard only. None of it reaches the comparison: the ranking
 * cannot import this module (tests/stats.test.ts).
 */

/** A stop of a searched trip; `days` only when the traveller gave it. */
export type StatLeg = { cc: string; days?: number };

export type StatEvent =
  | { e: 'view'; path: string; entry: boolean; ref: string | null; notFound?: boolean }
  /** A results page shown: the trip asked about, and how many answers it had. */
  | {
      e: 'search';
      to: StatLeg[];
      usage: string | null;
      /** What the calculator had ticked; absent from a page served before it. */
      act?: string[] | null;
      gb: boolean;
      currency: string;
      count: number;
    }
  /** Out to a provider: `pos` is where the plan stood in the list, from 1, or 0 for a leg of a combination. */
  | { e: 'click'; provider: string; to: string | null; pos: number; cheapest: boolean }
  | { e: 'code'; provider: string }
  | { e: 'share'; channel: 'whatsapp' }
  | { e: 'booking'; step: BookingStep; to: string | null };

export const bookingSteps = [
  'reminder',
  'continued',
  'card',
  'pick',
  'hotels',
  'cars',
  'attractions',
  'decline',
  'page-hotels',
  'page-cars',
  'page-attractions',
] as const;
export type BookingStep = (typeof bookingSteps)[number];

/** Where a visit came from, by the referring site's name only. */
const SOURCES: Array<[string, RegExp]> = [
  ['google', /(^|\.)google\./],
  ['bing', /(^|\.)bing\.com$/],
  ['facebook', /(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/],
  ['instagram', /(^|\.)instagram\.com$/],
  ['whatsapp', /(^|\.)(whatsapp\.com|wa\.me)$/],
  ['telegram', /(^|\.)(telegram\.org|t\.me)$/],
  ['x', /(^|\.)(x\.com|twitter\.com|t\.co)$/],
  ['chatgpt', /(^|\.)(chatgpt\.com|openai\.com)$/],
];

export function sourceOf(referrerHost: string | null, ownHost: string): string {
  const host = referrerHost?.trim().toLowerCase().replace(/^www\./, '') ?? '';
  if (!host) return 'direct';
  if (host === ownHost.replace(/^www\./, '')) return 'internal';
  return SOURCES.find(([, pattern]) => pattern.test(host))?.[0] ?? 'other-site';
}

/** Phone, tablet or computer, from the browser's own description — which is not kept. */
export function deviceOf(userAgent: string): 'phone' | 'tablet' | 'desktop' {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent)) return 'tablet';
  if (/Mobi|iPhone|iPod|Android/i.test(userAgent)) return 'phone';
  return 'desktop';
}

/** Robots, previews and automated browsers — our own test suites among them. */
export function isRobot(userAgent: string): boolean {
  return !userAgent || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|node-fetch|undici|^node$|playwright/i.test(userAgent);
}

/** A browser that asked not to be followed. */
export function optedOut(headers: Headers): boolean {
  return headers.get('sec-gpc') === '1' || headers.get('dnt') === '1';
}

/** The route of a page, from its address — never the address itself. */
export function routeOf(pathname: string): { route: string; lang: string; dest: string | null } {
  const parts = pathname.split('/').filter(Boolean);
  // The default language's pages have no prefix; a prefixed one may arrive either way.
  const lang = parts[0] && isLocale(parts[0]) ? parts.shift()! : locales[0];
  const [first, second, ...rest] = parts;
  if (!first) return { route: '/', lang, dest: null };
  const fixed = ['esim', 'search', 'devices', 'guides', 'about', 'accessibility', 'privacy', 'terms', 'disclosure', 'contact', 'unlock', 'car-rental', 'codes', 'reviews', 'providers'];
  if (!fixed.includes(first) || rest.length > 0) return { route: 'other', lang, dest: null };
  if (!second) return { route: `/${first}`, lang, dest: null };
  if (first === 'esim') {
    const country = getCountryBySlug(second);
    return country ? { route: '/esim/[country]', lang, dest: country.code } : { route: 'other', lang, dest: null };
  }
  if (first === 'guides') return { route: '/guides/[guide]', lang, dest: null };
  return { route: 'other', lang, dest: null };
}

const country = (code: unknown): string | null =>
  typeof code === 'string' && /^[A-Z]{2}$/.test(code) && getCountryByCode(code) ? code : null;
const provider = (id: unknown): string | null =>
  typeof id === 'string' && /^[a-z0-9-]{2,24}$/.test(id) && getProvider(id) ? id : null;

function daysBucket(days: number): string {
  if (days <= 3) return '1-3';
  if (days <= 7) return '4-7';
  if (days <= 14) return '8-14';
  if (days <= 30) return '15-30';
  return '31+';
}

function positionBucket(pos: number): string {
  if (pos === 0) return 'combination';
  if (pos <= 3) return String(pos);
  if (pos <= 10) return '4-10';
  return '11+';
}

/**
 * The day's counters for one event, or null for an event this file does not
 * recognise — which is dropped, never stored in some other form.
 *
 * `context` is what the server knows of the request: the visitor's country
 * (the host's header), their device class, and the site's own host.
 */
export function countersFor(
  event: unknown,
  context: { country: string | null; device: string; ownHost: string },
): Record<string, number> | null {
  if (!event || typeof event !== 'object') return null;
  const ev = event as Record<string, unknown>;
  const counts: Record<string, number> = {};
  const add = (name: string) => {
    counts[name] = (counts[name] ?? 0) + 1;
  };

  switch (ev.e) {
    case 'view': {
      if (typeof ev.path !== 'string' || ev.path.length > 200) return null;
      const { route, lang, dest } = routeOf(ev.path.split(/[?#]/)[0]);
      add('views');
      add(ev.notFound === true ? 'page:404' : `page:${route}`);
      add(`lang:${lang}`);
      if (dest && ev.notFound !== true) add(`destpage:${dest}`);
      if (ev.entry === true) {
        add('visits');
        add(`from:${sourceOf(typeof ev.ref === 'string' ? ev.ref.slice(0, 120) : null, context.ownHost)}`);
        add(`device:${context.device}`);
        const visitor = country(context.country);
        add(`country:${visitor ?? 'unknown'}`);
      }
      return counts;
    }
    case 'search': {
      if (!Array.isArray(ev.to) || ev.to.length === 0 || ev.to.length > 6) return null;
      if (typeof ev.count !== 'number' || !Number.isInteger(ev.count) || ev.count < 0) return null;
      const legs = ev.to
        .map((leg) => (leg && typeof leg === 'object' ? (leg as Record<string, unknown>) : {}))
        .map((leg) => ({ cc: country(leg.cc), days: leg.days === undefined || leg.days === null ? null : Number(leg.days) }))
        .filter((leg): leg is { cc: string; days: number | null } => leg.cc !== null)
        .filter((leg) => leg.days === null || (Number.isInteger(leg.days) && leg.days > 0 && leg.days <= 365));
      if (legs.length === 0) return null;
      const codes = [...new Set(legs.map((leg) => leg.cc))].sort();
      add('searches');
      for (const code of codes) {
        add(`search:${code}`);
        add(`region:${getCountryByCode(code)!.continent}`);
      }
      // The trip's length only when every stop's was given; otherwise it was assumed, not asked for.
      add(
        legs.every((leg) => leg.days !== null)
          ? `days:${daysBucket(legs.reduce((sum, leg) => sum + (leg.days ?? 0), 0))}`
          : 'days:unstated',
      );
      add(`stops:${legs.length >= 3 ? '3+' : legs.length}`);
      if (codes.length > 1) add(`combo:${codes.join('+')}`);
      // How the amount was answered: a typed figure, the calculator (with or
      // without the preference for unlimited), or a level from an older link.
      // Only names from the calculator's own list; anything else in it is dropped.
      const sent: unknown[] | null = Array.isArray(ev.act) && ev.act.length <= dataActivities.length * 2 ? ev.act : null;
      const ticked = sent ? dataActivities.filter((activity) => sent.includes(activity)) : null;
      if (ev.gb === true) add('usage:stated-gb');
      else if (ev.usage === 'unlimited') add('usage:unlimited');
      else if (ticked) add('usage:calculator');
      else if (typeof ev.usage === 'string' && (usageLevels as readonly string[]).includes(ev.usage)) add(`usage:${ev.usage}`);
      else add('usage:unstated');
      // Each tick, only when the ticks made the estimate.
      if (ticked && ev.gb !== true) {
        add('calculated');
        for (const activity of ticked) add(`act:${activity}`);
      }
      if (typeof ev.currency === 'string' && isCurrency(ev.currency)) add(`currency:${ev.currency}`);
      if (ev.count === 0) add(`zero:${codes.join('+')}`);
      return counts;
    }
    case 'click': {
      const id = provider(ev.provider);
      const pos = Number(ev.pos);
      if (!id || !Number.isInteger(pos) || pos < 0 || pos > 500) return null;
      add('clicks');
      add(`click:${id}`);
      const dest = country(ev.to);
      if (dest) add(`click:${id}:${dest}`);
      add(`position:${positionBucket(pos)}`);
      if (ev.cheapest === true) add('cheapest');
      return counts;
    }
    case 'code': {
      const id = provider(ev.provider);
      if (!id) return null;
      add(`code:${id}`);
      return counts;
    }
    case 'share': {
      if (ev.channel !== 'whatsapp') return null;
      add('share:whatsapp');
      return counts;
    }
    case 'booking': {
      if (typeof ev.step !== 'string' || !(bookingSteps as readonly string[]).includes(ev.step)) return null;
      add(`booking:${ev.step}`);
      const dest = country(ev.to);
      if (dest && (ev.step === 'hotels' || ev.step === 'cars' || ev.step === 'attractions')) add(`booking:${ev.step}:${dest}`);
      return counts;
    }
    default:
      return null;
  }
}

/** Counters the server adds by itself, outside the browser: a message sent from "contact us", by topic. */
export const contactCounter = (topic: string) => `contact:${topic.replace(/[^a-z-]/g, '').slice(0, 20) || 'other'}`;
