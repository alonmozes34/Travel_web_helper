import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countries } from '../src/data/countries';
import { mockPlans, getPlansForCountry } from '../src/data/mockPlans';
import { coveredCount, destinationCount, isCountryCovered } from '../src/lib/comparison/catalogueCoverage';
import { networksForDestinations } from '../src/lib/types/network';

test('a plan covers exactly as many destinations as it advertises', () => {
  for (const plan of mockPlans) {
    if (plan.coverage.kind === 'country') {
      assert.equal(plan.coverage.countries.length, 1, plan.id);
      continue;
    }
    assert.equal(
      plan.coverage.publishedDestinationCount,
      plan.coverage.countries.length,
      `${plan.id} claims ${plan.coverage.publishedDestinationCount} and covers ${plan.coverage.countries.length}`,
    );
  }
});

test('a destination with no country plan still finds the global plans that include it', () => {
  // Brazil has no plan of its own, and must not be a dead end.
  const brazil = getPlansForCountry('BR');
  assert.ok(brazil.length > 0, 'Brazil has plans');
  assert.ok(brazil.every((plan) => plan.coverage.kind !== 'country'));
  assert.ok(brazil.every((plan) => plan.coverage.countries.includes('BR')));
});

test('a plan is never offered for a destination outside its coverage', () => {
  for (const country of countries) {
    for (const plan of getPlansForCountry(country.code)) {
      assert.ok(
        plan.coverage.countries.includes(country.code),
        `${plan.id} offered for ${country.code}`,
      );
    }
  }
});

test('the catalogue reports its own limits honestly', () => {
  assert.equal(destinationCount, 243, 'every country except the uninhabited ones');
  assert.ok(coveredCount > 0 && coveredCount < destinationCount, 'the catalogue is partial');
  assert.equal(isCountryCovered('TH'), true);
  assert.equal(isCountryCovered('BR'), true);
  // Tonga is beyond the largest demo plan's destination list.
  assert.equal(isCountryCovered('TO'), false);
});

test('an operator in another country is never shown for this destination', () => {
  const [globalPlan] = mockPlans.filter((plan) => plan.coverage.kind === 'global');
  assert.ok(globalPlan);

  // We know Thai operators; we do not know Brazilian ones.
  const thai = networksForDestinations(globalPlan.networks, ['TH']);
  assert.ok(thai.length > 0);
  assert.ok(thai.every((network) => network.countryCode === 'TH'));

  const brazilian = networksForDestinations(globalPlan.networks, ['BR']);
  assert.equal(brazilian.length, 0, 'unknown must be empty, not "everything we know"');
});
