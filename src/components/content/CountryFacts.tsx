import { Disclosure } from '@/components/ui/Disclosure';
import type { Dictionary } from '@/i18n/getDictionary';
import type { CountryFact } from '@/lib/comparison/countryFacts';

/**
 * Practical information for a destination.
 *
 * Sits below the comparison, never above it: someone arriving from search for
 * "eSIM Thailand" wants prices first and reading material second.
 */
export function CountryFacts({ facts, dict }: { facts: CountryFact[]; dict: Dictionary }) {
  if (facts.length === 0) return null;

  return (
    <section className="border-t border-line-soft bg-surface py-12">
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <h2 className="font-head text-2xl font-semibold">{dict.country.factsTitle}</h2>
        <p className="mt-1 text-sm text-ink-3">{dict.country.factsNote}</p>
        <div className="mt-5 max-w-[76ch]">
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
