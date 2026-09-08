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
  home: {
    heroTitle: 'The best-value eSIM for your trip',
    heroSubtitle:
      'Compare plans from multiple providers in one place — by price, data, validity and local network.',
    trustStrip: [
      { strong: 'One place', rest: 'instead of ten provider sites' },
      { strong: 'Price per GB', rest: 'and per day, calculated for you' },
      { strong: 'Local network', rest: 'and 5G shown on every plan' },
    ],
  },
  search: {
    label: 'Destination',
    placeholder: 'Where are you going?',
    submit: 'Compare eSIMs',
    clear: 'Clear destination',
    suggestionsLabel: 'Destination suggestions',
    noResults: 'No destination found. Try a country name.',
    popularLabel: 'Popular destinations:',
    chooseFirst: 'Pick a destination to compare plans',
  },
  personalization: {
    trigger: 'Tailor plans to my trip',
    optional: 'Optional — results are shown either way',
    title: 'Tailor to your trip',
    note: 'Two questions. They sharpen the recommendation — they do not filter results.',
    durationLabel: 'How many days',
    usageLabel: 'Usage',
    submit: 'Update recommendations',
    reset: 'Reset',
    summaryPrefix: 'Tailored to',
    durations: { short: '1–3', week: '4–7', twoWeeks: '8–14', month: '15–30' },
    usages: { light: 'Light', regular: 'Regular', heavy: 'Heavy', unlimited: 'Unlimited' },
    usageHints: {
      light: 'WhatsApp, maps, email',
      regular: 'Social media, maps, browsing',
      heavy: 'Video, hotspot, frequent use',
      unlimited: 'Prefer unlimited',
    },
  },
  howItWorks: {
    title: 'How it works',
    steps: [
      { title: 'Pick a destination', text: 'Type where you are going and see every plan available there.' },
      {
        title: 'Compare plans',
        text: 'Price, data, validity, local network and 5G — in the same place on every row, so comparing takes seconds.',
      },
      {
        title: 'Buy directly from the provider',
        text: 'You continue to the provider you chose and complete the purchase and setup there.',
      },
    ],
  },
  trust: {
    title: 'Why compare here?',
    items: [
      { title: 'Prices from several providers', text: 'Every plan for your destination, in one place.' },
      { title: 'Price per GB and per day', text: 'Calculated automatically, so you can see real value.' },
      { title: 'Local network and 5G', text: 'Shown on every plan, not buried in the small print.' },
      { title: 'No extra cost', text: 'Comparing is free. You buy directly from the provider.' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      {
        question: 'What is an eSIM?',
        answer:
          'An eSIM is a digital SIM built into your device. Instead of swapping a physical card, you scan a QR code or install through an app, and the line is added to your phone.',
      },
      {
        question: 'How do I know if my phone supports eSIM?',
        answer:
          'Most iPhones from XS onwards, and recent Samsung Galaxy S and Google Pixel models, support eSIM. The device also has to be carrier-unlocked. Check with the provider before buying.',
      },
      {
        question: 'When should I install the eSIM?',
        answer:
          'Most providers recommend installing before you fly, while you have a stable connection. Validity usually starts only when the plan connects to a network at your destination, but this varies by provider.',
      },
      {
        question: 'Can I use hotspot?',
        answer:
          'It depends on the plan. Not every plan allows tethering. We show this on every result, including when the answer is no.',
      },
      {
        question: 'Can I keep my home SIM active?',
        answer:
          'Yes. The eSIM is added alongside your existing line, so you keep receiving calls and SMS on your home number while browsing on the eSIM. Turn off data roaming on the home line to avoid charges.',
      },
      {
        question: 'Does this site sell eSIMs?',
        answer:
          'No. We are a comparison tool only. Purchase, installation and support all happen directly with the provider you choose.',
      },
    ],
  },
  results: {
    summaryTemplate: 'We found {plans} plans from {providers} providers',
    tailoredTemplate: 'Tailored to {days} days · {usage} usage · about {gb}GB',
    defaultEstimate: 'General estimate — tailor it to your trip to sharpen the recommendation',
    change: 'Change',
    empty: 'No plans for this destination yet.',
  },
  plan: {
    data: 'Data',
    validity: 'Validity',
    network: 'Network',
    price: 'Price',
    view: 'View plan',
    details: 'Details',
    buyAtProvider: 'You buy on the provider’s site',
    prototypeLink: 'Prototype — the provider link is not live yet',
    hotspot: 'Hotspot',
    noHotspot: 'No hotspot',
    calls: 'Calls',
    noCalls: 'No calls',
    sms: 'SMS',
    noSms: 'No SMS',
    topUp: 'Top-up available',
    no5g: 'No 5G',
    perGbTemplate: '{price} / GB',
    perDayTemplate: '{price} / day',
    approxTemplate: '≈ {price}',
    chargedInTemplate: 'The provider charges in {currency}',
    fxNoteTemplate: 'Rate {rate} · demo data from {date}',
    estimateOnly: 'estimate only',
    conversionNote:
      'The shekel price is an estimate. The provider charges in its own currency, and your card issuer may use a different rate and add a foreign-transaction fee.',
    chargedHereTemplate: 'charged in {currency}',
    belowNeed: 'Below your estimated need',
    coversTripTemplate: 'Covers {days} trip days',
    shortValidity: 'Shorter than your trip',
    fairUsage: 'Unlimited — fair usage policy applies',
    fairUsageDetailTemplate: 'Full speed up to {gb}GB per day, then throttled to {kbps}kbps.',
    couponTemplate: 'Code {code} · saves {amount}',
    compareLabel: 'Compare',
    comparingLabel: 'Selected to compare',
    demoCoupon: 'Demo code',
  },
  details: {
    title: 'Plan details',
    sms: 'SMS',
    topUp: 'Top-up',
    activation: 'Installation',
    activationValues: { qr: 'QR code', app: 'App', both: 'QR code or app' },
    fairUsageTitle: 'Fair usage policy',
    whyTitle: 'Why this plan ranks where it does',
    scoreTemplate: 'Match score {score} out of 100',
    factors: {
      needFit: 'Covers the estimated need',
      price: 'Price relative to the other plans',
      headroom: 'Data beyond the estimate',
      features: 'Features (5G, hotspot, top-up)',
    },
    noCommission: 'The ranking is calculated from the facts above and nothing else. Commission is not one of them.',
    close: 'Close details',
  },
  recommendations: {
    bestValue: 'Best value',
    cheapest: 'Cheapest',
    bestForBrowsing: 'Best for browsing',
    bestUnlimited: 'Best unlimited',
    browsingNote:
      'Based on 5G, number of local networks, hotspot and allowance — not on measured real-world coverage.',
  },
  filters: {
    categoriesLabel: 'Recommended categories',
    resultsLabel: 'Comparison results',
    trayLabel: 'Plans selected for comparison',
    open: 'Filter and sort',
    title: 'Filter and sort',
    sort: 'Sort',
    sortOptions: {
      recommended: 'Recommended',
      price: 'Price, low to high',
      pricePerGb: 'Price per GB',
      data: 'Data',
      validity: 'Validity',
    },
    data: 'Data',
    validity: 'Validity',
    network: 'Local network',
    onlyFiveG: '5G only',
    features: 'Features',
    providers: 'Providers',
    price: 'Maximum price',
    clearAll: 'Clear all',
    showResultsTemplate: 'Show {count} results',
    activeTemplate: '{count} filters active',
    noResults: 'No plans match these filters. Try removing one.',
    daysTemplate: '{days} days',
    daysPlusTemplate: '{days} days+',
  },
  compare: {
    slotTemplate: 'Plan {index}',
    compare: 'Compare',
    clear: 'Clear comparison',
    remove: 'Remove',
    title: 'Plan comparison',
    maxReached: 'You can compare up to 3 plans',
    rows: {
      provider: 'Provider',
      price: 'Price',
      sourcePrice: 'Estimated conversion',
      data: 'Data',
      validity: 'Validity',
      perUnit: 'Unit price',
      network: 'Local network',
      technology: '5G',
      hotspot: 'Hotspot',
      calls: 'Calls',
      sms: 'SMS',
      topUp: 'Top-up',
      fairUsage: 'Fair usage policy',
    },
    differsLabel: 'Differs between plans',
  },
  country: {
    titleTemplate: 'eSIM for {country}',
    seoTitleTemplate: 'eSIM for {country} — compare prices and plans',
    metaDescriptionTemplate:
      'Compare eSIM plans for {country}: price, data, validity, local network and 5G — from every provider in one place.',
    factsTitle: 'Practical information',
    factsNote: 'Every answer here is calculated from the plans on this page — none of it is pre-written.',
    facts: {
      worksQuestion: 'Does eSIM work in {country}?',
      worksAnswerTemplate:
        'Yes. We found {plans} eSIM plans for {country} from {providers} providers. Every plan listed is for this destination and runs on local networks.',
      networksQuestion: 'Which networks are available?',
      networksAnswerTemplate: 'The plans we compared run on {operators}. Each plan shows its own network on its row.',
      dataQuestion: 'How much data do you need?',
      dataAnswerTemplate:
        'For a {days}-day trip: about {light}GB for light use, {regular}GB for regular use and {heavy}GB for heavy use. This is an estimate based on average daily consumption, not a promise.',
      fiveGQuestion: 'Is 5G available?',
      fiveGAnswerTemplate: '{count} of {total} plans include 5G, on {operators}.',
      fiveGNoneAnswer: 'None of the plans we compared for this destination include 5G.',
      hotspotQuestion: 'Can you use hotspot?',
      hotspotAnswerTemplate:
        '{count} of {total} plans allow tethering. Every row states explicitly whether a plan supports it.',
      hotspotNoneAnswer: 'None of the plans we compared for this destination allow tethering.',
    },
    backToSearch: 'Search another destination',
  },
  units: {
    perGb: '/GB',
    perDay: '/day',
    days: 'days',
    day: 'day',
    unlimited: 'Unlimited',
  },
};
