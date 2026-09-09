import assert from 'node:assert/strict';
import { test } from 'node:test';
import { outboundLink } from '../src/lib/affiliate/link';
import { mockPlans } from '../src/data/mockPlans';
import type { Plan } from '../src/lib/types/plan';

const withUrl = (affiliateUrl: string | null): Plan =>
  ({ ...mockPlans[0], affiliateUrl }) as Plan;

test('a plan with no link produces no link, rather than an empty one', () => {
  assert.equal(outboundLink(withUrl(null)), null);
  assert.equal(outboundLink(withUrl('')), null);
});

test('only http and https are followed', () => {
  // A feed is external input, and an href is somewhere a script can hide.
  assert.equal(outboundLink(withUrl('javascript:alert(1)')), null);
  assert.equal(outboundLink(withUrl('data:text/html,<script>')), null);
  assert.equal(outboundLink(withUrl('//example.test/x')), null);
  assert.ok(outboundLink(withUrl('https://example.test/x')));
  assert.ok(outboundLink(withUrl('http://example.test/x')));
});

test('an outbound link is marked as sponsored and safe to open', () => {
  const link = outboundLink(withUrl('https://example.test/plan'));
  assert.ok(link);
  // Google asks for rel="sponsored" on paid links specifically; noopener is
  // required for anything opening in a new tab.
  assert.ok(link.rel.includes('sponsored'));
  assert.ok(link.rel.includes('noopener'));
  assert.equal(link.target, '_blank');
  assert.equal(link.href, 'https://example.test/plan');
});

test('the mock catalogue still carries no links', () => {
  // Invented plans must never point anywhere: a demo price behind a real link
  // is the one combination that could cost a traveller money.
  for (const plan of mockPlans) {
    assert.equal(plan.affiliateUrl, null, plan.id);
    assert.equal(plan.source, 'mock', plan.id);
  }
});
