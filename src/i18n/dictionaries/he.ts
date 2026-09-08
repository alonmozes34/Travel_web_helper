/**
 * Hebrew dictionary — the source of truth for the copy and for the
 * `Dictionary` type. Every other locale must satisfy this shape.
 */
export const he = {
  meta: {
    siteName: 'eSIM Compare',
    tagline: 'השוואת חבילות eSIM לטיולים',
    defaultDescription:
      'משווים חבילות eSIM ממגוון ספקים במקום אחד — לפי מחיר, נפח גלישה, תוקף ורשת מקומית.',
  },
  brand: {
    name: 'eSIM Compare',
    logoAlt: 'eSIM Compare — השוואת חבילות eSIM',
    homeLabel: 'לדף הבית',
  },
  nav: {
    label: 'ניווט ראשי',
    compare: 'השוואת eSIM',
    howItWorks: 'איך זה עובד',
    faq: 'שאלות נפוצות',
    openMenu: 'פתיחת תפריט',
    closeMenu: 'סגירת תפריט',
    menuTitle: 'תפריט',
  },
  header: {
    languageLabel: 'שפה',
    currencyLabel: 'מטבע',
    skipToContent: 'דילוג לתוכן הראשי',
  },
  footer: {
    aboutTitle: 'על האתר',
    aboutText:
      'eSIM Compare הוא כלי השוואה עצמאי. אנחנו לא מוכרים חבילות eSIM — הרכישה מתבצעת ישירות אצל הספק שתבחרו.',
    productTitle: 'המוצר',
    legalTitle: 'מידע',
    disclosureLink: 'גילוי נאות',
    privacy: 'פרטיות',
    terms: 'תנאי שימוש',
    rights: 'כל הזכויות שמורות',
  },
  disclosure: {
    short: 'משווים אצלנו. רוכשים ישירות מהספק.',
    full: 'חלק מהקישורים באתר הם קישורי שותפים. ייתכן שנקבל עמלה אם תבצעו רכישה, ללא עלות נוספת עבורכם. גובה העמלה אינו משפיע על הדירוג.',
    rankingNote: 'הדירוג נקבע לפי ערך ללקוח בלבד.',
  },
  mockData: {
    badge: 'נתוני הדגמה',
    notice:
      'המחירים והנתונים באתר הם נתוני הדגמה שנוצרו לצורך פיתוח, ואינם הצעות אמיתיות של אף ספק.',
  },
  common: {
    loading: 'טוען…',
    close: 'סגירה',
    apply: 'החל',
    clearAll: 'נקה הכל',
    more: 'עוד',
    yes: 'כן',
    no: 'לא',
  },
  home: {
    heroTitle: 'ה‑eSIM הכי משתלם לטיול שלך',
    heroSubtitle:
      'משווים חבילות ממגוון ספקים במקום אחד — לפי מחיר, נפח גלישה, תוקף ורשת מקומית.',
    trustStrip: [
      { strong: 'השוואה במקום אחד', rest: 'במקום לפתוח עשרה אתרי ספקים' },
      { strong: 'מחיר ל‑GB', rest: 'ומחיר ליום מחושבים אוטומטית' },
      { strong: 'רשת מקומית', rest: 'ו‑5G מוצגים בכל חבילה' },
    ],
  },
  search: {
    label: 'יעד הטיול',
    placeholder: 'לאן טסים?',
    submit: 'השווה eSIM',
    clear: 'ניקוי היעד',
    suggestionsLabel: 'הצעות יעדים',
    noResults: 'לא מצאנו יעד כזה. נסו שם מדינה.',
    popularLabel: 'יעדים פופולריים:',
    chooseFirst: 'בחרו יעד כדי להשוות חבילות',
  },
  personalization: {
    trigger: 'התאם לי חבילה לטיול',
    optional: 'לא חובה — התוצאות מוצגות בכל מקרה',
    title: 'התאמה לטיול',
    note: 'שתי שאלות. הן מדייקות את ההמלצה — לא מסננות תוצאות.',
    durationLabel: 'כמה ימים',
    usageLabel: 'אופי שימוש',
    submit: 'עדכן המלצות',
    reset: 'איפוס',
    summaryPrefix: 'מותאם ל',
    durations: {
      short: '1–3',
      week: '4–7',
      twoWeeks: '8–14',
      month: '15–30',
    },
    usages: {
      light: 'קל',
      regular: 'רגיל',
      heavy: 'כבד',
      unlimited: 'ללא הגבלה',
    },
    usageHints: {
      light: 'WhatsApp, Waze, אימייל',
      regular: 'רשתות חברתיות, מפות, גלישה',
      heavy: 'וידאו, Hotspot, שימוש תכוף',
      unlimited: 'מעדיפים ללא הגבלה',
    },
  },
  howItWorks: {
    title: 'איך זה עובד',
    steps: [
      { title: 'בוחרים יעד', text: 'מקלידים לאן טסים ומקבלים את כל החבילות הזמינות למדינה.' },
      {
        title: 'משווים חבילות',
        text: 'מחיר, נפח, תוקף, רשת מקומית ו‑5G — באותו מקום בכל שורה, כדי שההשוואה תיקח שניות.',
      },
      {
        title: 'רוכשים ישירות מהספק',
        text: 'עוברים לאתר הספק שבחרתם ומשלימים שם את הרכישה וההתקנה.',
      },
    ],
  },
  trust: {
    title: 'למה להשוות אצלנו?',
    items: [
      { title: 'מחירים ממספר ספקים', text: 'כל החבילות למדינה שבחרתם, במקום אחד.' },
      { title: 'מחיר ל‑GB ומחיר ליום', text: 'מחושבים אוטומטית, כדי שתדעו מה באמת משתלם.' },
      { title: 'רשת מקומית ו‑5G', text: 'מוצגים בכל חבילה, לא מוסתרים באותיות הקטנות.' },
      { title: 'ללא תשלום נוסף', text: 'ההשוואה חינמית. הרכישה מתבצעת ישירות אצל הספק.' },
    ],
  },
  faq: {
    title: 'שאלות נפוצות',
    items: [
      {
        question: 'מה זה eSIM?',
        answer:
          'eSIM הוא כרטיס SIM דיגיטלי המובנה במכשיר. במקום להחליף כרטיס פיזי, סורקים קוד QR או מתקינים דרך אפליקציה, והקו נוסף למכשיר.',
      },
      {
        question: 'איך יודעים אם הטלפון שלי תומך ב‑eSIM?',
        answer:
          'רוב מכשירי ה‑iPhone מדור XS ואילך, וכן דגמי Samsung Galaxy S ו‑Google Pixel מהשנים האחרונות, תומכים ב‑eSIM. חשוב גם שהמכשיר לא יהיה נעול לרשת מסוימת. כדאי לוודא מול הספק לפני הרכישה.',
      },
      {
        question: 'מתי כדאי להתקין את ה‑eSIM?',
        answer:
          'רוב הספקים ממליצים להתקין לפני הטיסה, בזמן שיש חיבור אינטרנט יציב. התוקף לרוב מתחיל רק כשהחבילה מתחברת לרשת ביעד — אבל זה משתנה בין ספקים, אז כדאי לבדוק בעמוד החבילה.',
      },
      {
        question: 'האם אפשר להשתמש ב‑Hotspot?',
        answer:
          'תלוי בחבילה. לא כל חבילה מאפשרת שיתוף אינטרנט. אנחנו מציגים את המידע הזה בכל תוצאה, כולל כשהתשובה היא לא.',
      },
      {
        question: 'האם אפשר לשמור את ה‑SIM הישראלי פעיל?',
        answer:
          'כן. ה‑eSIM נוסף לצד הקו הקיים, כך שאפשר להמשיך לקבל שיחות ו‑SMS למספר הישראלי ולגלוש דרך ה‑eSIM. כדאי לכבות נדידת נתונים בקו הישראלי כדי להימנע מחיובים.',
      },
      {
        question: 'האם האתר מוכר את ה‑eSIM?',
        answer:
          'לא. אנחנו כלי השוואה בלבד. הרכישה, ההתקנה והתמיכה מתבצעות ישירות מול הספק שתבחרו.',
      },
    ],
  },
  results: {
    summaryTemplate: 'מצאנו {plans} חבילות מ‑{providers} ספקים',
    tailoredTemplate: 'מותאם ל‑{days} ימים · שימוש {usage} · כ‑{gb}GB',
    defaultEstimate: 'הערכה כללית — התאימו לטיול שלכם כדי לדייק את ההמלצה',
    change: 'שנה',
    empty: 'אין עדיין חבילות ליעד הזה.',
  },
  plan: {
    data: 'נפח',
    validity: 'תוקף',
    network: 'רשת',
    price: 'מחיר',
    view: 'צפייה בחבילה',
    details: 'פרטים',
    buyAtProvider: 'הרכישה מתבצעת באתר הספק',
    prototypeLink: 'אב־טיפוס — הקישור לספק עדיין לא פעיל',
    hotspot: 'Hotspot',
    noHotspot: 'ללא Hotspot',
    calls: 'שיחות',
    noCalls: 'ללא שיחות',
    sms: 'SMS',
    noSms: 'ללא SMS',
    topUp: 'ניתן לטעינה חוזרת',
    no5g: 'ללא 5G',
    perGbTemplate: '{price} / GB',
    perDayTemplate: '{price} / יום',
    approxTemplate: '≈ {price}',
    chargedInTemplate: 'החיוב אצל הספק מתבצע ב־{currency}',
    fxNoteTemplate: 'שער {rate} · נתוני הדגמה מ־{date}',
    estimateOnly: 'הערכה בלבד',
    conversionNote:
      'המחיר בשקלים הוא המרה משוערת. הספק גובה במטבע שלו, וחברת האשראי עשויה להמיר בשער אחר ולהוסיף עמלת מטבע חוץ.',
    chargedHereTemplate: 'מחויב ב־{currency}',
    belowNeed: 'מתחת לצריכה הצפויה',
    coversTripTemplate: 'מכסה {days} ימי טיול',
    shortValidity: 'קצר מהטיול שהוגדר',
    fairUsage: 'Unlimited — קיימת מדיניות שימוש הוגן',
    fairUsageDetailTemplate: 'מהירות מלאה עד {gb}GB ביום, ולאחר מכן האטה ל־{kbps}kbps.',
    couponTemplate: 'קוד {code} · חיסכון {amount}',
    compareLabel: 'להשוואה',
    comparingLabel: 'נבחר להשוואה',
    demoCoupon: 'קוד הדגמה',
  },
  recommendations: {
    bestValue: 'הכי משתלם',
    cheapest: 'הכי זול',
    bestForBrowsing: 'הכי טוב לגלישה',
    bestUnlimited: 'Unlimited הכי טוב',
    browsingNote:
      'נקבע לפי 5G, מספר הרשתות המקומיות, Hotspot ונפח — לא לפי מדידת כיסוי בשטח.',
  },
  filters: {
    open: 'סינון ומיון',
    title: 'סינון ומיון',
    sort: 'מיון',
    sortOptions: {
      recommended: 'מומלץ',
      price: 'מחיר נמוך לגבוה',
      pricePerGb: 'מחיר ל‑GB',
      data: 'כמות גלישה',
      validity: 'תוקף',
    },
    data: 'נפח גלישה',
    validity: 'תוקף',
    network: 'רשת מקומית',
    onlyFiveG: '5G בלבד',
    features: 'מאפיינים',
    providers: 'ספקים',
    price: 'מחיר מרבי',
    clearAll: 'נקה הכל',
    showResultsTemplate: 'הצג {count} תוצאות',
    activeTemplate: '{count} מסננים פעילים',
    noResults: 'אין חבילות שמתאימות לסינון. נסו להסיר מסנן.',
    daysTemplate: '{days} ימים',
    daysPlusTemplate: '{days} ימים+',
  },
  compare: {
    slotTemplate: 'חבילה {index}',
    compare: 'השווה',
    clear: 'ניקוי ההשוואה',
    remove: 'הסרה',
    title: 'השוואת חבילות',
    maxReached: 'אפשר להשוות עד 3 חבילות',
    rows: {
      provider: 'ספק',
      price: 'מחיר',
      sourcePrice: 'המרה משוערת',
      data: 'נפח',
      validity: 'תוקף',
      perUnit: 'מחיר ליחידה',
      network: 'רשת מקומית',
      technology: '5G',
      hotspot: 'Hotspot',
      calls: 'שיחות',
      sms: 'SMS',
      topUp: 'טעינה חוזרת',
      fairUsage: 'מדיניות שימוש הוגן',
    },
    differsLabel: 'שונה בין החבילות',
  },
  country: {
    titleTemplate: 'eSIM ל{country}',
    seoTitleTemplate: 'eSIM ל{country} — השוואת מחירים וחבילות',
    metaDescriptionTemplate:
      'השוואת חבילות eSIM ל{country}: מחיר, נפח גלישה, תוקף, רשת מקומית ו‑5G — מכל הספקים במקום אחד.',
    backToSearch: 'חיפוש יעד אחר',
  },
  units: {
    perGb: 'ל‑GB',
    perDay: 'ליום',
    days: 'ימים',
    day: 'יום',
    unlimited: 'ללא הגבלה',
  },
};

export type Dictionary = typeof he;
