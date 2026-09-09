import { MB_PER_GB } from '@/lib/formatters/data';

/**
 * Recovering eSIM facts from a product name.
 *
 * An affiliate catalogue is a generic e-commerce feed. It carries a name, a
 * price, a currency and a link — and nothing else this comparison needs. The
 * gigabytes, the days and the destination live inside strings a marketing team
 * wrote for humans: "Japan 10GB 30 Days", "Moshi Moshi - 5 GB - 15 Days",
 * "Europe Unlimited (7 days)".
 *
 * So this parser exists, and its most important property is that it refuses.
 * Every function here returns `null` rather than a plausible guess, because a
 * plan that says "10GB" on our page must be a plan the provider called 10GB.
 * Getting that wrong is worse than showing nothing: a traveller buys the wrong
 * size and blames us, correctly.
 *
 * Nothing here is clever on purpose. Patterns that are ambiguous are rejected
 * rather than resolved by preference.
 */

/** `10GB`, `10 GB`, `500MB`, `1.5 GB`, `10G`. Returns MB. */
export function parseAllowanceMb(text: string): number | null {
  if (isUnlimited(text)) return 0;

  // Deliberately anchored on a word boundary: "5G" in "5G network" is a
  // technology, not an allowance, and matching it would turn every 5G plan
  // into a 5GB one.
  const matches = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(GB|MB|TB)\b/gi)];
  if (matches.length === 0) return null;
  // Two different allowances in one name is not something to pick between.
  const values = new Set(matches.map((m) => `${m[1]}${m[2].toUpperCase()}`));
  if (values.size > 1) return null;

  const [, rawAmount, rawUnit] = matches[0];
  const amount = Number.parseFloat(rawAmount.replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const unit = rawUnit.toUpperCase();
  if (unit === 'MB') return Math.round(amount);
  if (unit === 'GB') return Math.round(amount * MB_PER_GB);
  return Math.round(amount * MB_PER_GB * 1024);
}

const UNLIMITED = /\b(unlimited|ilimitado|illimité|unbegrenzt|ללא הגבלה|בלי הגבלה)\b/i;

export function isUnlimited(text: string): boolean {
  return UNLIMITED.test(text);
}

/** `30 Days`, `30-day`, `30d`, `1 Day`, `ל־30 ימים`. Returns days. */
export function parseValidityDays(text: string): number | null {
  const matches = [
    ...text.matchAll(/(\d+)\s*[-‑]?\s*(days?|day|d\b|ימים|יום)/gi),
  ];
  if (matches.length === 0) return null;

  const values = new Set(matches.map((m) => m[1]));
  if (values.size > 1) return null;

  const days = Number.parseInt(matches[0][1], 10);
  // A year is the outer bound of anything sold as a travel eSIM; beyond that
  // the number is far more likely to be something else that happened to sit
  // next to the word "day".
  if (!Number.isFinite(days) || days <= 0 || days > 365) return null;
  return days;
}

/**
 * The destination, as a country name we can resolve to an ISO code.
 *
 * Returns the candidate strings rather than a code: resolving them is the
 * caller's job, because only the caller knows the country list and the
 * aliases. Order is longest first, so "United Arab Emirates" is tried before
 * "United".
 */
export function destinationCandidates(text: string): string[] {
  // Strip the parts that are certainly not a place: allowances, durations,
  // technologies and the punctuation used to separate them.
  const cleaned = text
    .replace(/\d+(?:[.,]\d+)?\s*(GB|MB|TB)\b/gi, ' ')
    .replace(/\d+\s*[-‑]?\s*(days?|d\b|ימים|יום)/gi, ' ')
    .replace(/\b(4G|5G|LTE|eSIM|SIM|data|plan|prepaid|travel)\b/gi, ' ')
    .replace(/[()[\]{}|/\\_·•,–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const words = cleaned.split(' ');
  const candidates: string[] = [];
  // Every contiguous run of up to four words, longest first.
  for (let size = Math.min(4, words.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= words.length; start += 1) {
      candidates.push(words.slice(start, start + size).join(' '));
    }
  }
  return [...new Set(candidates)];
}

/** A price in a currency's minor unit, from a decimal string or number. */
export function parseMinorAmount(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'));
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
