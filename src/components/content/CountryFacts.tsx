import { Disclosure } from '@/components/ui/Disclosure';
import { interpolate } from '@/i18n/interpolate';
import { SectionTitle } from './SectionTitle';
import type { Dictionary } from '@/i18n/getDictionary';
import type { CountryFact } from '@/lib/comparison/countryFacts';

/**
 * Practical information for a destination.
 *
 * Sits below the comparison, never above it: someone arriving from search for
 * "eSIM Thailand" wants prices first and reading material second.
 */
export function CountryFacts({ facts, dict, countryName }: { facts: CountryFact[]; dict: Dictionary; countryName: string }) {
  if (facts.length === 0) return null;

  return (
    <section id="esim-facts" className="scroll-mt-20 border-t border-line-soft bg-surface py-12">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <SectionTitle icon="📶">{interpolate(dict.country.factsTitleTemplate, { country: countryName })}</SectionTitle>
        <p className="mt-2 text-sm text-ink-3">{dict.country.factsNote}</p>
        <div className="mt-5 max-w-[76ch] rounded-lg border border-line bg-surface px-5">
          {facts.map((fact) => (
            <Disclosure key={fact.question} summary={fact.question} defaultOpen>
              {fact.answer}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
