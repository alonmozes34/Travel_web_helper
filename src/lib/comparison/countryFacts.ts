import { MB_PER_GB } from '@/lib/formatters/data';
import { hasTechnology, networksForDestinations } from '@/lib/types/network';
import type { Comparison } from './buildComparison';
import { dailyDataMbByUsage } from './estimateDataNeed';

export type CountryFact = { question: string; answer: string };

type FactsDictionary = {
  worksQuestion: string;
  worksAnswerTemplate: string;
  networksQuestion: string;
  networksAnswerTemplate: string;
  dataQuestion: string;
  dataAnswerTemplate: string;
  fiveGQuestion: string;
  fiveGAnswerTemplate: string;
  fiveGNoneAnswer: string;
  hotspotQuestion: string;
  hotspotAnswerTemplate: string;
  hotspotNoneAnswer: string;
};

/**
 * The practical section of a country page, derived entirely from the plans on
 * that page.
 *
 * This is the difference between useful SEO content and keyword filler: the
 * answers cannot go stale relative to the listings, and nothing is asserted
 * that the data does not support. When no plan offers 5G, the page says so
 * rather than staying silent.
 */
export function buildCountryFacts({
  comparison,
  countryName,
  facts,
  interpolate,
}: {
  comparison: Comparison;
  countryName: string;
  facts: FactsDictionary;
  interpolate: (template: string, values: Record<string, string | number>) => string;
}): CountryFact[] {
  const { rows, estimate } = comparison;
  const total = rows.length;

  // A regional plan lists operators in a dozen countries; only the ones in
  // this destination belong in this destination's answer.
  const relevant = (row: (typeof rows)[number]) =>
    networksForDestinations(row.plan.networks, comparison.countryCodes);

  const operators = [...new Set(rows.flatMap((row) => relevant(row).map((n) => n.operator)))].sort();

  const fiveGRows = rows.filter((row) => hasTechnology(relevant(row), '5G'));
  const fiveGOperators = [
    ...new Set(
      fiveGRows.flatMap((row) =>
        relevant(row)
          .filter((network) => network.technologies.includes('5G'))
          .map((network) => network.operator),
      ),
    ),
  ].sort();

  const hotspotCount = rows.filter((row) => row.plan.hotspot).length;
  const gbFor = (usage: keyof typeof dailyDataMbByUsage) =>
    Math.max(1, Math.round((estimate.days * dailyDataMbByUsage[usage]) / MB_PER_GB));

  return [
    {
      question: interpolate(facts.worksQuestion, { country: countryName }),
      answer: interpolate(facts.worksAnswerTemplate, {
        country: countryName,
        plans: comparison.planCount,
        providers: comparison.providerCount,
      }),
    },
    {
      question: facts.networksQuestion,
      answer: interpolate(facts.networksAnswerTemplate, { operators: operators.join(', ') }),
    },
    {
      question: facts.dataQuestion,
      answer: interpolate(facts.dataAnswerTemplate, {
        days: estimate.days,
        light: gbFor('light'),
        regular: gbFor('regular'),
        heavy: gbFor('heavy'),
      }),
    },
    {
      question: facts.fiveGQuestion,
      answer:
        fiveGRows.length === 0
          ? facts.fiveGNoneAnswer
          : interpolate(facts.fiveGAnswerTemplate, {
              count: fiveGRows.length,
              total,
              operators: fiveGOperators.join(', '),
            }),
    },
    {
      question: facts.hotspotQuestion,
      answer:
        hotspotCount === 0
          ? facts.hotspotNoneAnswer
          : interpolate(facts.hotspotAnswerTemplate, { count: hotspotCount, total }),
    },
  ];
}
