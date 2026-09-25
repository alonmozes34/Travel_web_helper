import type { Dictionary } from './he';

/**
 * English is not part of the V1 launch scope, but the dictionary is kept in
 * sync so that no component ever has to hard-code a string.
 */
export const en: Dictionary = {
  meta: {
    siteName: 'Yesh Klita',
    tagline: 'Compare travel eSIM plans',
    defaultDescription:
      'Compare travel eSIM plans by destination, price, data, validity and network — and pick the one that fits your trip.',
    shareImageAlt: 'Yesh Klita — compare travel eSIM plans. Compare here, buy directly from the provider.',
  },
  brand: {
    // The Hebrew brand is "יש קליטה?"; English keeps the transliteration
    // rather than a literal translation, which would read as nonsense.
    name: 'Yesh Klita',
    logoAlt: 'Yesh Klita — compare travel eSIM plans',
    homeLabel: 'Go to homepage',
  },
  nav: {
    label: 'Main navigation',
    compare: 'Compare eSIMs',
    howItWorks: 'How it works',
    faq: 'FAQ',
    devices: 'Device compatibility',
    destinations: 'All destinations',
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
      'Yesh Klita is an independent comparison site for travel eSIM plans. We neither sell nor issue eSIMs; comparing is free, and you buy directly from the provider you choose.',
    productTitle: 'Product',
    legalTitle: 'Information',
    disclosureLink: 'Affiliate disclosure',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: 'All rights reserved',
    versionLabel: 'Version',
  },
  disclosure: {
    short: 'Compare here. Buy directly from the provider.',
    full: 'Some links on this site are affiliate links. We may earn a commission if you make a purchase, at no extra cost to you. Commission never affects ranking.',
    rankingNote: 'Ranking is based on customer value only.',
  },
  disclosurePage: {
    title: 'Affiliate disclosure',
    intro:
      'Yesh Klita is an independent comparison site. We do not sell or issue eSIM plans, and every purchase is made directly with the provider.',
    sections: [
      {
        heading: 'How we make money',
        body: [
          'Some links to providers are affiliate links. If you buy through one, the provider may pay us a commission — at no extra cost to you, and with no change to the price you pay them.',
          'Not every provider on the site is an affiliate partner, and providers who pay us nothing are shown in exactly the same way.',
        ],
      },
      {
        heading: 'Why commission cannot affect the ranking',
        body: [
          'This is structural rather than a promise: the model every plan is stored in has no commission field, no payout field and no manual-rank field. The scorer receives only the plan\u2019s own facts and the trip you described, so it has no way to know what a provider pays us — even if someone wanted it to.',
          'The order comes from price, how well the allowance fits the data we estimate for your trip, headroom and extras. The full explanation is on the results page, under the sort control.',
        ],
      },
      {
        heading: 'Discount codes',
        body: [
          'When a provider gives us a discount code for visitors to this site, the code is tracked to us just like an affiliate link, and a purchase with it may earn us a commission.',
          'When the code is open to everyone, the price shown and ranked is the price after the discount, with the original beside it. When it is only for the provider’s new customers, the price and the ranking stay on the regular price, and the code is shown next to it.',
          'A code gives a provider no advantage beyond the discount itself, and every code is shown the same way. A code that expires leaves the site on the day it expires.',
        ],
      },
      {
        heading: 'What we do not do',
        body: [
          'We do not take payment for placement, sell positions at the top of a list, or hide a provider who does not work with us.',
          'We do not invent prices, ratings or provider capabilities. Anything we cannot verify is marked as such, or not shown at all.',
        ],
      },
    ],
  },
  mockData: {
    badge: 'Demo data',
    short: 'The prices here are not real — the site is pre-launch.',
    mixedShort: 'Some prices on this page are not real.',
    mixedNotice:
      'Some plans on this page are demo data and are marked as such. The rest come from the provider. Do not rely on the marked figures for a purchase.',
    more: 'What does that mean?',
    notice:
      'Prices and plan data on this site are demo data, and are not real offers from any provider. The site is pre-launch, and real prices arrive as provider catalogues are connected. Do not rely on the current figures for a purchase.',
  },
  common: {
    loading: 'Loading…',
    close: 'Close',
    apply: 'Apply',
    clearAll: 'Clear all',
    more: 'More',
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown',
    notStated: 'Not stated',
  },
  home: {
    heroTitle: 'Yesh Klita',
    heroDescriptor: 'Compare travel eSIM plans',
    heroSubtitle:
      'Compare travel eSIM plans in one place and pick the one that fits your trip.',
    trustStrip: [
      { strong: 'Everything in one place', rest: 'instead of ten provider sites' },
      { strong: 'The price in your currency', rest: 'next to what your card is charged' },
      { strong: 'No paid placement', rest: 'our commission never changes the order' },
    ],
  },
  search: {
    label: 'Destination',
    placeholder: 'Where are you going?',
    submit: 'Compare plans',
    clear: 'Clear destination',
    suggestionsLabel: 'Destination suggestions',
    noResults: 'No destination found. Try a country name.',
    popularLabel: 'Popular destinations:',
    recentLabel: 'Recent searches',
    popularGroupLabel: 'Popular destinations',
    daysFieldLabel: 'For how many days?',
    whatIsEsim:
      'An eSIM is a digital SIM card. You install it on your phone before you travel and land abroad with working internet — no hunting for a shop at the airport, and your home SIM stays where it is.',
    addAnother: 'Add another destination',
    daysLabelTemplate: 'Days in {country}',
    daysUnit: 'days',
    removeTemplate: 'Remove {country}',
    multiTitleTemplate: 'eSIM for {destinations}',
    coverageAll: 'Covers every destination',
    coverageRegionTemplate: 'Regional plan · {region}',
    coverageGlobal: 'Global plan',
    coverageClaimTemplate: 'Provider states {count} destinations',
    coverageVerifiedTemplate: 'of which {count} we can verify',
    coverageVerifiedAllTemplate: '{count} destinations, all verified',
    noFullCoverage:
      'No single plan covers all of your destinations. The combination below covers them together.',
    pendingTitle: 'You changed the trip. The results below still show the previous search.',
    pendingApply: 'Update the results',
    emptyTitle: 'Where are you going?',
    emptyBody:
      'Pick one destination or more to compare plans. Several stops can share one trip — we look for a single plan covering them all and for a cheaper combination.',
    uncoveredTitleTemplate: 'We have no plan at all for {destinations}',
    uncoveredBodyPartial:
      'Because of that destination there is no single plan covering the whole trip, and no combination either. Remove it from the search to see what exists for the rest.',
    uncoveredBodyAll:
      'We found no plan at all — country, regional or global — that includes the destinations you chose. That does not mean no eSIM exists there; it means ours does not list one.',
    daysHint: 'How many days at each stop? Without it we assume a week each.',
    assumedDaysTemplate: 'We assumed {days} days per stop. Set the days to sharpen it.',
    chooseFirst: 'Pick a destination to compare plans',
  },
  personalization: {
    trigger: 'Change the days and usage',
    optional: 'These two answers decide which plan fits',
    title: 'About your trip',
    note: 'Without these two answers any recommendation is a guess. It takes ten seconds.',
    durationLabel: 'How many days',
    usageLabel: 'What will you use the internet for?',
    submit: 'Show the plans that fit',
    reset: 'Reset',
    summaryPrefix: 'Tailored to',
    durations: { short: '1–3', week: '4–7', twoWeeks: '8–14', month: '15–30' },
    usages: {
      navigation: 'Navigation and messages only',
      light: 'Light',
      regular: 'Regular',
      heavy: 'Heavy',
      hotspot: 'Hotspot for all my devices',
      unlimited: 'Unlimited',
    },
    usageHints: {
      navigation: 'Maps, WhatsApp, calls and email — no long browsing sessions',
      light: 'Messages, maps, a little browsing and photos',
      regular: 'Social media, maps, browsing and the occasional video',
      heavy: 'Video, video calls, uploading photos and clips',
      hotspot: 'Tethering a laptop and other devices — instead of fixed internet',
      unlimited: 'Prefer a plan with no volume cap and no counting GB',
    },
    perDayTemplate: 'about {amount} a day on our estimate',
    exactLabel: 'I know exactly how many GB I need',
    exactHint: 'For instance if the plan replaces fixed internet, or you already know your usage',
    exactFieldLabel: 'How many GB for the whole trip?',
    exactPlaceholder: '20',
    totalTemplate: 'Estimated total: about {gb}GB for {days} days',
    totalStatedTemplate: 'You asked for {gb}GB across {days} days',
    missingTitle: 'Two more details and we can start',
    missingDestination: 'Choose a destination',
    missingDays: 'Fill in how many days for each destination',
    missingUsage: 'Choose what you will use the internet for, or enter a GB figure',
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
    summaryOneProviderTemplate: 'We found {plans} plans from one provider',
    tailoredTemplate: 'Tailored to {days} days · {usage} usage · about {gb}GB',
    tailoredStatedTemplate: 'For {days} days · the {gb}GB you asked for',
    legEstimateTemplate: '{country} · {days} {unit} ≈ {gb}GB',
    defaultEstimate: 'A general estimate only — fill in the days and what you will use the internet for to get a real recommendation',
    change: 'Change',
    showAllTemplate: 'Show {count} more plans',
    shortSectionTitle: 'Plans smaller than your expected usage',
    shortSectionBody:
      'These will run out before the trip ends on the usage you described, so they are not ranked against the plans above. They are here because people sometimes choose one anyway — for instance when they expect to be on Wi‑Fi most of the time.',
    noneCoverNeed:
      'No plan in our catalogue reaches the amount of data you described for this destination. Everything below will run out before the trip ends.',
    empty: 'No plans for this destination yet.',
  },
  plan: {
    data: 'How much data',
    validity: 'How long it lasts',
    network: 'Local network',
    networkUnknown: 'The provider has not published the network for this destination',
    price: 'Price',
    view: 'Go to the provider',
    viewAtTemplate: 'Go to {provider}',
    details: 'More details',
    buyAtProvider: 'You do not pay here — the purchase happens on the provider’s site',
    prototypeLink: 'Prototype — the provider link is not live yet',
    opensInNewTab: '(opens in a new tab, on the provider’s site)',
    hotspot: 'Tethering',
    noHotspot: 'No tethering',
    calls: 'Calls',
    noCalls: 'No calls',
    hotspotUnknown: 'Hotspot: not stated',
    callsUnknown: 'Calls: not stated',
    sms: 'SMS',
    noSms: 'No SMS',
    topUp: 'You can add more data',
    fiveG: 'Fast 5G network',
    no5g: 'No 5G',
    dataDaysTemplate: 'about {days} days at the usage you chose',
    dataDaysOneTemplate: 'about one day at the usage you chose',
    unlimitedNote: 'Data with no volume cap',
    perGbTemplate: '{price} per GB',
    perDayTemplate: '{price} per day',
    approxTemplate: '≈ {price}',
    chargedInTemplate: 'The provider charges in {currency}',
    fxNoteTemplate: 'Rate {rate} · demo data from {date}',
    estimateOnly: 'estimate only',
    conversionNote:
      'The shekel price is an estimate. The provider charges in its own currency, and your card issuer may use a different rate and add a foreign-transaction fee.',
    conversionRateLiveTemplate: 'Exchange rates: {rates} · European Central Bank, {date}',
    conversionRateFallbackTemplate: 'Exchange rates: {rates} · fallback rates from {date}. Not a live rate.',
    conversionSummary: 'How we worked out the price in your currency',
    maxCompareShort: 'Up to 3 plans',
    chargedHereTemplate: 'charged in {currency}',
    youPayLabel: 'What it costs you (roughly)',
    chargedLabel: 'What your card will be charged',
    chargedExplains: 'The provider bills in its own currency. Your card issuer converts at its own rate and usually adds a foreign-transaction fee, so the final amount may differ slightly.',
    belowNeed: 'Below your estimated need',
    coversTripTemplate: 'Covers {days} trip days',
    shortValidity: 'Shorter than your trip',
    fairUsage: 'No volume cap — but there is a daily ceiling',
    fairUsageCapped: 'No volume cap — but speed drops after a limit',
    fairUsageDetailTemplate: 'Full speed up to {gb}GB per day, then throttled to {speed}.',
    fairUsageDetailPlanTemplate: 'Full speed up to {gb}GB for the whole plan, then throttled to {speed}.',
    fairUsageDetailUnknownTemplate:
      'Full speed up to {gb}GB, then throttled to {speed}. The provider does not say whether the limit is per day or for the whole plan.',
    fairUsageShortDayTemplate: '{gb}GB a day, then {speed}',
    fairUsageShortPlanTemplate: '{gb}GB per plan, then {speed}',
    fairUsageShortUnknownTemplate: '{gb}GB, then {speed}',
    fullSpeedTemplate: 'up to {amount} at full speed',
    couponTemplate: 'Code {code} · saves {amount}',
    compareLabel: 'Tick to compare',
    comparingLabel: 'Selected to compare',
    demoCoupon: 'Demo code',
    sitePromoTemplate: '{percent} off for visitors of this site',
    firstPurchasePromoTemplate: '{percent} off your first purchase',
    promoCodeTemplate: 'code {code}',
    promoInLink: 'already applied by the link',
    promoSavingTemplate: 'saves {amount}',
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
    recommendedSummary: 'What does the "recommended" order rank by?',
    recommendedNote:
      'Price carries the most weight (about 52%), then how well the allowance fits the data we estimate for your trip (28%), extra data beyond that need (12%), and extras such as 5G, hotspot and top-up (8%). A plan that expires before the trip ends, or throttles early, is marked down accordingly. What we earn in commission plays no part at any stage.',
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
  combination: {
    badge: 'Plan combination',
    titleTemplate: 'A combination of {count} plans',
    note: 'Two separate purchases from two providers, each with its own installation.',
    total: 'Total',
    legTemplate: 'for {countries}',
    legChargedTemplate: 'provider charges {amount}',
    cheaperTemplate: '{amount} cheaper than the cheapest single plan covering everything',
    dearerTemplate: '{amount} dearer than the cheapest single plan covering everything',
    onlyOption: 'This is the only way to cover all of your destinations',
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
      price: 'What it costs you (roughly)',
      sourcePrice: 'What your card is charged',
      data: 'How much data',
      validity: 'How long it lasts',
      perUnit: 'Price per GB',
      network: 'Local network',
      technology: 'Fast 5G network',
      hotspot: 'Tethering',
      calls: 'Calls',
      sms: 'SMS',
      topUp: 'You can add more data',
      fairUsage: 'Fair usage policy',
    },
    differsLabel: 'Differs between plans',
  },
  country: {
    titleTemplate: 'eSIM for {country}',
    seoTitleTemplate: 'eSIM for {country} – compare plans and prices',
    metaDescriptionTemplate:
      'Compare eSIM plans for {country}: price, data, validity, local network and 5G — from every provider in one place.',
    factsTitle: 'Practical information',
    factsNote: 'Every answer here is calculated from the plans on this page — none of it is pre-written.',
    facts: {
      worksQuestion: 'Does eSIM work in {country}?',
      worksAnswerTemplate:
        'Yes. We found {plans} eSIM plans for {country} from {providers}. Every plan listed works in this destination and runs on local networks.',
      networksQuestion: 'Which networks are available?',
      networksAnswerTemplate: 'The plans we compared run on {operators}. Each plan shows its own network on its row.',
      networksUnknownAnswer:
        'We do not have the network list for this destination. The plans on this page are regional or global, and their providers have not published which local network they use here. We would rather say we do not know than guess.',
      dataQuestion: 'How much data do you need?',
      dataAnswerTemplate:
        'For a {days}-day trip: about {light}GB for light use, {regular}GB for regular use and {heavy}GB for heavy use. This is an estimate based on average daily consumption, not a promise.',
      fiveGQuestion: 'Is 5G available?',
      fiveGAnswerTemplate: '{count} of {total} plans include 5G, on {operators}.',
      fiveGNoneAnswer: 'None of the plans we compared for this destination include 5G.',
      fiveGUnknownAnswer:
        'Unknown. Without the network list for this destination there is no way to tell which plans support 5G, and we will not guess.',
      providersOne: 'one provider',
      providersTemplate: '{count} providers',
      hotspotQuestion: 'Can you use hotspot?',
      hotspotAnswerTemplate:
        '{count} of {total} plans allow tethering. Every row says whether a plan supports it, does not, or the provider does not say.',
      hotspotNoneAnswer: 'None of the plans we compared for this destination allow tethering.',
      hotspotUnknownAnswer:
        'Unknown. The providers do not say whether their plans for this destination allow tethering, and we will not guess. If it matters to you, check with the provider before you buy.',
      worksAnswerBroadTemplate:
        'Yes. No plan is sold for {country} alone, but we found {plans} regional and global plans from {providers} that list {country} among their destinations.',
    },
    backToSearch: 'Search another destination',
    coverage: {
      broadOnlyTitleTemplate: 'No plan is sold for {country} alone',
      broadOnlyBody:
        'The plans below are regional or global plans that list this destination. They work there exactly like a single-country plan, but they are sold for several countries at once — which usually makes them dearer for a trip to one.',
      noneTitleTemplate: 'We have no plan for {country} yet',
      noneBody:
        'We found no plan at all — country, regional or global — that includes this destination. That does not mean no eSIM exists for {country}; it means ours does not list one.',
      noneStatusTemplate:
        'The current catalogue covers {covered} of the {total} destinations you can search here. Coverage comes from the catalogues of the providers connected to the site, and changes with them.',
      noneAlternativesTitle: 'In the meantime, these destinations can be compared',
    },
  },
  accessibility: {
    navLabel: 'Accessibility statement',
    title: 'Accessibility statement',
    intro:
      'We treat accessibility as part of the product rather than an addition to it. This page sets out what has been done, against which standard, what is not accessible yet, and how to report a problem.',
    pendingBadge: 'Draft — not yet complete',
    pendingNotice:
      'There is no route here for reporting an accessibility problem, so this statement is not complete. Everything else on this page is accurate and current.',
    notSet: 'Not set',
    standardTitle: 'The standard this site is built against',
    standardTemplate:
      'The site is built to {standard}, which adopts the {basis} guidelines at conformance level {level}.',
    standardNote:
      'Conformance with a standard is not the same as certification. Certification is issued by a licensed service-accessibility consultant.',
    entityTitle: 'Site operator',
    reviewedTitle: 'Last reviewed',
    auditorTitle: 'Who carried out the accessibility review',
    auditorTemplate: '{name}, licensed service-accessibility consultant, licence {licence}',
    doneTitle: 'What has been done',
    done: [
      'The whole search and comparison journey can be completed with the keyboard alone, with a visible focus indicator on every control.',
      'An automated contrast test that fails if any text colour drops below a 4.5:1 ratio.',
      'axe-core run across seven states of the site against WCAG 2.0/2.1/2.2 at levels A and AA.',
      'Usable at 320 pixels wide and at 200% text size, with no horizontal scrolling.',
      'Touch targets of at least 44 pixels on the main interactive controls.',
      'Modals built on the native <dialog> element, so focus trapping, Escape and background inertness come from the browser.',
      'The system preference for reduced motion is honoured.',
      'Semantic heading structure, an accessible name on every control, and text alternatives for non-text content.',
    ],
    limitationsTitle: 'What is not accessible yet',
    limitations: [
      'The site has not been tested with screen readers (NVDA, VoiceOver, JAWS), and in particular the reading of Hebrew text interleaved with numbers and English terms has not been checked.',
      'The site has not been reviewed by a licensed accessibility consultant and has not been tested with disabled users.',
      'The site is under development, and parts of it are still changing.',
    ],
    contactTitle: 'Reporting an accessibility problem',
    contactIntro:
      'Found something that is not accessible? We want to know — that report is the one that helps us fix it.',
    coordinatorLabel: 'Accessibility coordinator',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    addressLabel: 'Postal address',
    responseLabel: 'Response time',
    operatorIndividual: 'An individual. The site is not operated by a company or a registered business.',
    notRequiredAudit: 'A licensed service-accessibility consultant is not required to approve a website under regulation 35.',
    notRequiredCoordinator: 'An accessibility coordinator is required of an organisation employing 25 people or more.',
    noContactYet:
      'No route for reporting a problem has been published yet, so this statement is not complete. Until one is, do not rely on this page.',
    responseTemplate: 'Within {days} business days',
    updatedTemplate: 'Last updated: {date}',
  },
  preview: {
    navTitle: 'Preview',
    heading: 'This part is still closed',
    body: 'The comparison pages are not published yet — the site is pre-launch.',
    invite: 'Been given a password? Enter it here.',
    label: 'Password',
    submit: 'Enter',
    error: 'That password is not right. Try again.',
    back: 'Back to the homepage',
    publicHint: 'The rest of the site is open and explains what the tool does.',
  },
  devicesPage: {
    navLabel: 'Device compatibility',
    title: 'Does your device support eSIM?',
    intro:
      'A travel eSIM installs onto a chip built into the device. If that chip is not there, the plan cannot be installed — and refunds are rarely simple. Check before you buy, not after.',
    updatedTemplate: "The lists here are copied from the manufacturers' own support pages, last checked on {date}.",
    staleNote:
      'A model released after that date will not appear here yet. When that happens, the check on the device itself is the answer that counts.',
    check: {
      title: 'The reliable check is on the device itself',
      intro:
        'A model list can mislead: the same model bought in a different country sometimes ships without an eSIM chip. Samsung says so outright. The menu on your own device cannot be wrong.',
      supportTitle: 'How to check for support',
      installTitle: 'How to install a plan you bought',
      guides: [
        {
          id: 'ios',
          title: 'iPhone and iPad',
          supportSteps: [
            'Open the Settings app.',
            'Tap General, then tap About.',
            'Scroll down and look for a line labelled EID. That is the identifier of the eSIM chip: if the line is there, the device has an eSIM. If it is not, it does not.',
          ],
          installSteps: [
            'Open Settings and tap Cellular.',
            'Tap Set Up Cellular or Add eSIM.',
            'Choose the method your provider gave you: scan a QR code, follow an install link, or enter the details manually.',
            'Installing needs a Wi-Fi connection, so set the plan up at home before you fly rather than at an airport abroad.',
          ],
        },
        {
          id: 'samsung',
          title: 'Samsung Galaxy',
          supportSteps: [
            'Open Settings.',
            'Tap Connections, then tap SIM manager.',
            'If Add eSIM appears there, the device supports it. If the menu offers only a physical SIM, this model as sold in the country it was bought in does not.',
          ],
          installSteps: [
            'Go to Settings, then Connections, then SIM manager.',
            'Tap Add eSIM.',
            'Scan the QR code your provider sent, or enter the details manually.',
            'This also needs Wi-Fi — do it before you travel.',
          ],
        },
        {
          id: 'pixel',
          title: 'Google Pixel',
          supportSteps: [
            'Open Settings.',
            'Tap Network & internet, then tap SIMs.',
            'If Add SIM appears, and inside it Set up an eSIM, the device supports it.',
          ],
          installSteps: [
            'Go to Settings, then Network & internet, then SIMs.',
            'Tap Add SIM, then Set up an eSIM.',
            'Choose your provider and follow the instructions on screen.',
            'Wi-Fi is needed here too. Install before you fly.',
          ],
        },
      ],
    },
    other: {
      title: 'Another brand — Xiaomi, Motorola, OnePlus, Honor',
      body: [
        'There is no single official list covering every manufacturer, and we do not publish a list we could not verify against the manufacturer itself.',
        'The check that works on almost any Android device: Settings → Network & internet → SIMs. If there is an option to add an eSIM, the device supports it.',
        'A quicker route: dial *#06# on the keypad. The screen shows the device identifiers, and if an EID is among them, the device has an eSIM chip.',
      ],
    },
    lock: {
      title: 'One more blocker worth checking: a carrier-locked phone',
      body: [
        'A device bought on a carrier plan may be locked to that carrier. If it is, another provider’s plan will not work even when the eSIM chip is present and healthy.',
        'On iPhone: Settings → General → About, and look for the Carrier Lock line. If it reads No SIM Restrictions, the device is unlocked.',
        'Android has no single place to check this, so ask the carrier the device was bought from.',
      ],
    },
    list: {
      title: 'The model lists',
      intro:
        "These cover Apple, Samsung and Google, copied from their support pages. Search by model name — “iPhone 13”, “Galaxy S21”, “Pixel 8”.",
      searchLabel: 'Search for a model',
      searchPlaceholder: 'iPhone 13, Galaxy S21, Pixel 8…',
      clear: 'Clear search',
      resultsTemplate: '{count} models listed',
      oneResult: '1 model listed',
      noResults: 'No model by that name.',
      noResultsHint:
        'That does not mean the device is unsupported — these lists cover only Apple, Samsung and Google. Check the menu on the device using the steps above.',
      sourceTemplate: 'Source: {source}, checked {date}',
      sourceLabels: {
        appleIphone: 'Apple — eSIM on iPhone',
        appleIpad: 'Apple — eSIM on iPad',
        appleModels: 'Apple — identify your iPhone model',
        samsung: 'Samsung — Galaxy eSIM',
        pixel: 'Google — dual SIM on Pixel',
      },
      opensInNewTab: '(opens in a new tab, on the manufacturer’s site)',
    },
    support: {
      yes: 'Supported',
      regional: 'Depends where it was bought',
      no: 'Not supported',
    },
    supportHint: {
      yes: 'The manufacturer lists these models as supporting eSIM.',
      regional:
        'The manufacturer lists these as supported in some markets only. Check the device itself before buying.',
      no: 'These models fall outside the support the manufacturer publishes. An eSIM plan will not work on them.',
    },
    brands: {
      apple: 'Apple',
      samsung: 'Samsung',
      google: 'Google',
    },
    kinds: {
      phone: 'Phones',
      tablet: 'Tablets',
    },
    groupTitles: {
      'apple-iphone-supported': 'iPhone — eSIM supported',
      'apple-iphone-unsupported': 'iPhone — no eSIM',
      'apple-ipad-supported': 'iPad — Wi-Fi + Cellular models',
      'samsung-galaxy-s': 'Galaxy S',
      'samsung-galaxy-z': 'Galaxy Z — foldables',
      'samsung-galaxy-a': 'Galaxy A',
      'samsung-xcover': 'Galaxy XCover',
      'samsung-tab': 'Galaxy Tab',
      'pixel-supported': 'Pixel — eSIM supported',
      'pixel-outside-rule': 'Pixel — earlier generations',
    },
    notes: {
      chinaMainland:
        'A device bought in mainland China is a separate case: Apple states that only iPhone 18 Pro, iPhone 18 Pro Max, iPhone 17e and iPhone Air support eSIM there.',
      hongKongMacao:
        'In Hong Kong and Macao some iPhone models ship with two physical nano-SIM slots instead of an eSIM.',
      samsungOrigin:
        'Samsung states it plainly: depending on the country of origin, eSIM may not be supported even on a model that appears in the list.',
      samsungARegion:
        'On the A series, support is limited to certain markets — Europe, North America and Korea (and, for the A54, Japan).',
      pixelDualEsim:
        'On Pixel 7 and later you can hold two eSIM profiles active at once, if your carrier allows it.',
      pixelOutsideRule:
        "Google's guidance covers Pixel 3a and later. Earlier generations fall outside it, and we do not state a conclusion we have not verified.",
    },
    cta: {
      title: 'Device supported? Compare plans',
      body: 'Pick a destination and a number of days to see which plans fit the trip.',
      link: 'Compare plans',
    },
  },

  tripExtras: {
    heading: 'One more thing for your trip',
    esimChosen: 'eSIM plan selected',
    carRental: {
      questionTemplate: 'Need a rental car in {country}?',
      questionGeneric: 'Need a rental car for your trip?',
      body: 'Compare rental car prices for your destination.',
      accept: 'Compare rental cars',
      decline: 'No thanks',
      opensInNewTab: '(opens in a new tab — your search stays open here)',
      dismiss: 'Dismiss this offer',
    },
  },
  carRentalPage: {
    navLabel: 'Car rental',
    title: 'Compare rental car prices',
    intro:
      'We do not rent cars and we do not sell insurance. This is a comparison only — booking always happens directly with the rental company or the broker.',
    countryKnownTemplate: 'Your destination: {country}.',
    needPickup:
      'We know the country from your search but not the city, so you will need to say where the car is picked up.',
    form: {
      title: 'Rental details',
      country: 'Country',
      countryPlaceholder: 'Choose a country',
      pickupLocation: 'Pick-up location',
      pickupPlaceholder: 'City, airport or address',
      pickupKind: 'Type of pick-up location',
      sameDropoff: 'Return the car to the same place',
      dropoffLocation: 'Drop-off location',
      dropoffPlaceholder: 'City, airport or address',
      pickupDate: 'Pick-up date',
      pickupTime: 'Pick-up time',
      dropoffDate: 'Drop-off date',
      dropoffTime: 'Drop-off time',
      driverAge: 'Driver age',
      driverAgeHint: 'Drivers under 25 usually pay a surcharge.',
      submit: 'Search for cars',
      datesHint: 'The dates are defaults — change them to your own trip dates.',
    },
    pickupKinds: {
      airport: 'Airport',
      city: 'City centre',
      train: 'Train station',
      other: 'Another location',
    },
    errors: {
      country: 'Choose a country.',
      pickup: 'Enter where the car is picked up.',
      dropoff: 'Enter where the car is returned, or tick the same-place option.',
      dates: 'Choose a pick-up date and a drop-off date.',
      dateOrder: 'The drop-off date has to be after the pick-up date.',
      age: 'Enter an age between 18 and 99.',
    },
    results: {
      titleTemplate: 'Cars in {location}',
      countTemplate: '{count} offers',
      oneResult: '1 offer',
      daysTemplate: 'for {days} days',
      none: 'No offers for this search.',
      noneHint: 'Try another city, different dates, or another pick-up point.',
      notSearched: 'Fill in the details above to see offers.',
      total: 'Total for the period',
      chargedTemplate: 'The rental company charges {amount}',
      convertedNote: 'Shekel prices are an estimated conversion. The actual charge is made in the rental company\u2019s own currency.',
      perDayTemplate: '{price} per day',
      orSimilarTemplate: '{model} or similar',
      categoryOnly: 'The rental company guarantees a category, not a specific model.',
      seatsTemplate: '{count} seats',
      bagsTemplate: '{count} bags',
      viewDeal: 'View deal',
      noLink: 'Prototype — no booking link yet',
      ratingTemplate: 'Rated {score} out of {outOf}',
      ratingCountTemplate: '{count} reviews',
      noRating: 'No rating supplied',
      pickupLabel: 'Pick-up',
      insuranceLabel: 'Insurance',
      fuelLabel: 'Fuel',
      mileageLabel: 'Mileage',
      cancellationLabel: 'Cancellation',
    },
    categories: {
      mini: 'Mini',
      economy: 'Economy',
      compact: 'Compact',
      intermediate: 'Intermediate',
      suv: 'SUV',
      van: 'Van',
      luxury: 'Luxury',
    },
    transmission: {
      automatic: 'Automatic',
      manual: 'Manual',
    },
    fuel: {
      'full-to-full': 'Collect full, return full',
      'full-to-empty': 'Pay for a full tank up front',
      'same-to-same': 'Return at the same fuel level',
      unknown: 'Fuel policy not supplied',
    },
    mileage: {
      unlimited: 'Unlimited mileage',
      limited: 'Limited mileage',
      unknown: 'Mileage policy not supplied',
    },
    cancellation: {
      free: 'Free cancellation',
      paid: 'Cancellation for a fee',
      none: 'No cancellation',
      unknown: 'Cancellation policy not supplied',
    },
    insurance: {
      'excess-applies': 'An excess applies. Check the amount with the rental company.',
      'basic-included': 'Basic cover is included. The rental company sets what it actually covers.',
      unknown: 'Insurance details were not supplied to us. Check them before booking.',
    },
    demo: {
      title: 'These offers are not real',
      body: 'No car rental provider is connected yet. The names and prices here were created for development, they are not any company’s offer, and nothing can be booked through them.',
      rowLabel: 'Demo data',
    },
  },

  destinationIndex: {
    navLabel: 'All destinations',
    title: 'eSIM for every destination',
    intro:
      'Pick a destination to see which eSIM plans fit it, what they cost, and which local network they run on.',
    statusTemplate: 'We have plans for {covered} of the {total} destinations you can search here.',
    demoNote: 'Prices on the destination pages are still demo data — the site is pre-launch.',
    popularTitle: 'Most searched',
    allTitle: 'Every destination, by continent',
    coveredLabel: 'Plans available',
    notCoveredLabel: 'Nothing yet',
    countTemplate: '{count} destinations',
  },
  relatedDestinations: {
    title: 'Other destinations nearby',
    body: 'If the trip has another stop, compare that too — one regional plan is sometimes cheaper than two country plans.',
  },

  privacyPage: {
    navLabel: 'Privacy',
    title: 'Privacy notice',
    intro:
      'This site asks you for nothing. There is no sign-up, no form, no payment, and no way for us to know who you are. What is kept on your own device is listed here in full.',
    reviewedTemplate: 'Checked against the code on {date}.',
    operator: {
      heading: 'Who runs this site',
      body: [
        'The site is run by one person, not a company. There is no registered commercial entity behind it.',
        'For anything to do with privacy — including asking what is stored or asking for it to be removed — write to the address at the foot of this page.',
      ],
    },
    notCollected: {
      heading: 'What we do not do',
      intro: 'None of the following exists on this site, and that is checkable in the code:',
      items: [
        'No user accounts and no sign-up.',
        'Not one form that collects personal details.',
        'No payments and no card details. Buying always happens on the provider’s own site.',
        'No analytics tool. The module that names events on this site sends them nowhere.',
        'No ad networks, no tracking pixels, no profiling.',
      ],
    },
    storage: {
      heading: 'What is kept on your device',
      intro:
        'Four items, all of them in your own browser. None of them is sent to us or to anyone else:',
      keyLabel: 'Name',
      kindLabel: 'Type',
      purposeLabel: 'Why',
      kinds: {
        cookie: 'Cookie',
        local: 'Local storage',
        session: 'Tab storage',
      },
      purposes: {
        currency: 'The currency you chose for prices, so you do not have to choose it on every visit.',
        preview: 'A preview password, and only while the preview gate is closed. It is open, so this cookie is not written.',
        recentDestinations: 'The country codes you searched for recently, to offer them in the search field. Country codes only.',
        tripExtras: 'That you dismissed the car rental offer, so it is not offered again in the same tab.',
      },
      conditionalNote: 'Only written when that feature is switched on.',
      clearing:
        'All of these are removed when you clear site data in your browser. Tab storage also goes when you close the tab.',
    },
    logs: {
      heading: 'Server logs',
      body: [
        'The site is hosted on Vercel, and hosting services keep technical request logs — including IP address, browser type and the page requested. Every site on the internet does this.',
        'We do not read those logs to identify anyone, do not combine them with anything, and do not build profiles from them. They exist to run and secure the server.',
      ],
    },
    outbound: {
      heading: 'Links to providers',
      body: [
        'When you follow a button through to a provider, you leave this site. From that point the provider’s privacy policy applies, not ours.',
        'The link carries an affiliate identifier telling the provider the click came from us. It says nothing about you — not a name, not an email, not what you searched for.',
        'The provider may set cookies of their own on their site. We have no control over those and no access to them.',
      ],
    },
    rights: {
      heading: 'Your rights',
      body: [
        'Because we hold nothing that identifies you, there is no record for you to ask to see, correct or delete.',
        'What is stored sits in your browser and is entirely under your control — clearing site data removes all of it.',
        'If you have a privacy question or concern anyway, write to us and you will get a straight answer.',
      ],
    },
    changes: {
      heading: 'Changes',
      body: [
        'If this page changes, the date above changes with it. It is checked against the code rather than written once and forgotten.',
      ],
    },
    contactHeading: 'Contact',
  },
  termsPage: {
    navLabel: 'Terms of use',
    title: 'Terms of use',
    intro:
      'Yesh Klita is a comparison and information site. We do not sell eSIM plans, we do not issue them, and we are not a party to anything between you and a provider.',
    updatedTemplate: 'Last updated {date}.',
    sections: [
      {
        heading: 'What this site is',
        body: [
          'We gather eSIM plans from different providers, rank them against the trip details you give us, and send you to the provider’s own site.',
          'Buying, paying, activating, support and cancellations all happen with the provider. We are not part of that transaction.',
        ],
      },
      {
        heading: 'About the prices and the data',
        body: [
          'Prices and plan details come from provider sources and are shown with the date they were checked. They change, and promotions end.',
          'The binding price is the one on the provider’s site at the moment of purchase. It is always worth checking there before you pay.',
          'We do not invent prices, ratings or capabilities. A figure we could not verify is marked as such or is not shown at all.',
        ],
      },
      {
        heading: 'This is not personal advice',
        body: [
          'The ranking is calculated from plan data and the trip details you entered. It does not account for your handset, your home carrier or anything else about your circumstances.',
          'What to buy is your decision. We provide a tool for comparing, not advice.',
        ],
      },
      {
        heading: 'Our commercial relationship',
        body: [
          'Some links to providers are affiliate links, and we may earn a commission on a purchase made through them — at no extra cost to you.',
          'Commission does not affect the ranking. The full explanation is on the affiliate disclosure page.',
        ],
      },
      {
        heading: 'Third-party sites',
        body: [
          'A link to a provider is not an endorsement of their terms, their privacy policy or the service you will receive.',
          'We are not responsible for content on external sites, for undertakings given there, or for any contract formed between you and them.',
        ],
      },
      {
        heading: 'Availability and liability',
        body: [
          'The site is provided as it is. We do not undertake that it will be continuously available, free of faults, or accurate at every moment.',
          'So far as the law allows, we are not liable for indirect loss arising from use of the site or from reliance on information on it. If you find an error, tell us and we will correct it.',
        ],
      },
      {
        heading: 'Governing law',
        body: ['These terms are governed by the laws of the State of Israel.'],
      },
    ],
    contactHeading: 'Contact',
    contactBody: 'For questions about these terms, or to report an error on the site:',
  },

  units: {
    perGb: '/GB',
    perDay: '/day',
    days: 'days',
    day: 'day',
    unlimited: 'Unlimited',
  },
};
