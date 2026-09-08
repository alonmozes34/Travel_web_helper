import type { Dictionary } from './he';

/**
 * English is not part of the V1 launch scope, but the dictionary is kept in
 * sync so that no component ever has to hard-code a string.
 */
export const en: Dictionary = {
  meta: {
    siteName: 'eSIM Compare',
    tagline: 'Compare travel eSIM plans',
    defaultDescription:
      'Compare eSIM plans from multiple providers in one place — by price, data, validity and local network.',
  },
  brand: {
    name: 'eSIM Compare',
    logoAlt: 'eSIM Compare — compare travel eSIM plans',
    homeLabel: 'Go to homepage',
  },
  nav: {
    label: 'Main navigation',
    compare: 'Compare eSIMs',
    howItWorks: 'How it works',
    faq: 'FAQ',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menuTitle: 'Menu',
  },
  header: {
    languageLabel: 'Language',
    currencyLabel: 'Currency',
    skipToContent: 'Skip to main content',
  },
  footer: {
    aboutTitle: 'About',
    aboutText:
      'eSIM Compare is an independent comparison tool. We do not sell eSIM plans — you buy directly from the provider you choose.',
    productTitle: 'Product',
    legalTitle: 'Information',
    disclosureLink: 'Affiliate disclosure',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: 'All rights reserved',
  },
  disclosure: {
    short: 'Compare here. Buy directly from the provider.',
    full: 'Some links on this site are affiliate links. We may earn a commission if you make a purchase, at no extra cost to you. Commission never affects ranking.',
    rankingNote: 'Ranking is based on customer value only.',
  },
  mockData: {
    badge: 'Demo data',
    notice:
      'Prices and plan data on this site are demo data created for development. They are not real offers from any provider.',
  },
  common: {
    loading: 'Loading…',
    close: 'Close',
    apply: 'Apply',
    clearAll: 'Clear all',
    more: 'More',
    yes: 'Yes',
    no: 'No',
  },
  units: {
    perGb: '/GB',
    perDay: '/day',
    days: 'days',
    day: 'day',
    unlimited: 'Unlimited',
  },
};
