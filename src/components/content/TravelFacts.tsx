import type { ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { interpolate } from '@/i18n/interpolate';
import type { CountryTravelFacts } from '@/data/countryFacts.generated';
import { quoteUnits, type LocalRates } from '@/lib/sources/ecb/localCurrencyRates';
import { minutesAheadOfIsrael } from '@/lib/travel/timeDifference';

/** The official warnings page; its old address, which the NSC keeps redirecting. */
const NSC_TRAVEL_WARNINGS = 'https://www.nsc.gov.il/he/Travel-Warnings/Pages/default.aspx';

/**
 * "Before you go": capital, money, languages, power, driving side, time
 * difference, emergency numbers — the owner's idea (1 October 2026).
 *
 * Every line comes from `countryFacts.generated.ts`, which takes each fact
 * from a source anyone can check, or from the ECB's rates and the platform's
 * time zone data at the moment the page is shown. A line with no fact behind
 * it is not drawn. Safety is a link to the official warnings, not our own
 * words about a country.
 *
 * Below the comparison, like the eSIM facts: someone arriving for prices sees
 * prices first.
 */
export function TravelFacts({
  facts,
  countryName,
  locale,
  dict,
  rates,
  now = new Date(),
}: {
  facts: CountryTravelFacts | undefined;
  countryName: string;
  locale: Locale;
  dict: Dictionary;
  rates: LocalRates | null;
  now?: Date;
}) {
  if (!facts) return null;
  const t = dict.travelFacts;
  const name = (named: { he: string | null; en: string | null }) => (locale === 'he' ? named.he ?? named.en : named.en ?? named.he);
  const numberLocale = locale === 'he' ? 'he-IL' : 'en-IL';
  const shekels = (value: number) =>
    new Intl.NumberFormat(numberLocale, { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(value);
  const date = (iso: string) => new Intl.DateTimeFormat(numberLocale, { dateStyle: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

  const rows: Array<{ label: string; value: ReactNode }> = [];

  const capitals = facts.capital.map((city) => name(city)).filter(Boolean);
  if (capitals.length) rows.push({ label: t.capital, value: capitals.join(', ') });

  if (facts.currencies.length) {
    const rated = facts.currencies.filter((currency) => currency.code !== 'ILS' && rates?.ilsPer.has(currency.code));
    rows.push({
      label: t.currency,
      value: (
        <>
          {facts.currencies.map((currency) => `${name(currency) ?? currency.code} (${currency.code})`).join(' · ')}
          {rated.map((currency) => {
            const perUnit = rates!.ilsPer.get(currency.code)!;
            const units = quoteUnits(perUnit);
            return (
              <span key={currency.code} className="mt-1 block text-sm text-ink-2">
                {interpolate(t.rateTemplate, {
                  units: units.toLocaleString(numberLocale),
                  currency: name(currency) ?? currency.code,
                  ils: shekels(perUnit * units),
                })}
              </span>
            );
          })}
          {rated.length && rates ? (
            <span className="mt-0.5 block text-sm text-ink-3">{interpolate(t.rateNote, { date: date(rates.asOf) })}</span>
          ) : null}
        </>
      ),
    });
  }

  const languages = facts.languages.map((language) => name(language)).filter(Boolean);
  if (languages.length) rows.push({ label: t.languages, value: languages.join(', ') });

  // Each part in its own line, the plug letters isolated: run together, the
  // Latin letters and the Hebrew reordered each other ("A, B 220 וולט שקע מסוג").
  if (facts.plugs.length || facts.voltages.length) {
    const [beforeTypes, afterTypes = ''] = t.plugsTemplate.split('{types}');
    rows.push({
      label: t.power,
      value: (
        <>
          {facts.plugs.length ? (
            <span className="block">
              {beforeTypes}
              <bdi dir="ltr">{facts.plugs.join(', ')}</bdi>
              {afterTypes}
            </span>
          ) : null}
          {facts.voltages.length ? (
            <span className="block">{interpolate(t.voltsTemplate, { volts: facts.voltages.join('/') })}</span>
          ) : null}
        </>
      ),
    });
  }

  if (facts.driving) rows.push({ label: t.driving, value: facts.driving === 'right' ? t.drivingRight : t.drivingLeft });

  if (facts.timeZone) {
    const minutes = minutesAheadOfIsrael(facts.timeZone, now);
    const hours = Math.abs(minutes) / 60;
    const span = hours === 1 ? t.hourOne : interpolate(t.hoursTemplate, { n: hours.toLocaleString(numberLocale, { maximumFractionDigits: 2 }) });
    const difference = minutes === 0 ? t.sameTime : interpolate(minutes > 0 ? t.aheadTemplate : t.behindTemplate, { hours: span });
    const where = facts.multipleTimeZones && capitals[0] ? ` ${interpolate(t.inCapitalTemplate, { city: capitals[0] })}` : '';
    rows.push({
      label: t.timeDifference,
      value: (
        <>
          {difference}
          {where}
          {facts.multipleTimeZones ? <span className="mt-1 block text-sm text-ink-2">{t.multipleZones}</span> : null}
        </>
      ),
    });
  }

  if (facts.emergency.length) {
    rows.push({
      label: t.emergency,
      value: (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {facts.emergency.map((entry) => (
            <li key={entry.number}>
              <bdi dir="ltr" className="font-semibold tabular-nums text-ink">
                {entry.number}
              </bdi>{' '}
              <span className="text-ink-2">{t.emergencyUses[entry.use]}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (facts.callingCode) {
    rows.push({
      label: t.callingCode,
      value: (
        <bdi dir="ltr" className="tabular-nums">
          {facts.callingCode}
        </bdi>
      ),
    });
  }

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="travel-facts-title" className="border-t border-line-soft bg-surface-2 py-12">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 id="travel-facts-title" className="font-head text-2xl font-semibold">
          {interpolate(t.titleTemplate, { country: countryName })}
        </h2>
        <dl className="mt-5 grid max-w-[900px] gap-x-10 gap-y-5 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-sm font-semibold text-ink-3">{row.label}</dt>
              <dd className="mt-1 text-base text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-8 font-head text-lg font-semibold">{t.moreTitle}</h3>
        <ul className="mt-2 grid gap-1">
          {facts.wikivoyage ? (
            <li>
              <a
                href={facts.wikivoyage.url}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-6 items-center text-brand underline underline-offset-2"
              >
                {t.wikivoyage}
                {facts.wikivoyage.lang === 'en' && t.inEnglish ? ` ${t.inEnglish}` : ''}
                <span className="sr-only"> {t.opensInNewTab}</span>
              </a>
            </li>
          ) : null}
          <li>
            <a
              href={NSC_TRAVEL_WARNINGS}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-6 items-center text-brand underline underline-offset-2"
            >
              {t.warnings}
              <span className="sr-only"> {t.opensInNewTab}</span>
            </a>
          </li>
        </ul>
        <p className="mt-6 max-w-[80ch] text-sm text-ink-3">{t.sources}</p>
      </div>
    </section>
  );
}
