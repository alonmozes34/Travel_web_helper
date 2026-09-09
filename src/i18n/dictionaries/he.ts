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
    short: 'המחירים כאן אינם אמיתיים.',
    more: 'מה זה אומר?',
    notice:
      'המחירים והנתונים באתר הם נתוני הדגמה שנוצרו לצורך פיתוח, ואינם הצעות אמיתיות של אף ספק. אין להסתמך עליהם לרכישה.',
  },
  common: {
    loading: 'טוען…',
    close: 'סגירה',
    apply: 'החל',
    clearAll: 'ניקוי הכול',
    more: 'עוד',
    yes: 'כן',
    no: 'לא',
    unknown: 'לא ידוע',
  },
  home: {
    heroTitle: 'אינטרנט בחו״ל, בלי הפתעות בחשבון',
    heroSubtitle:
      'eSIM הוא כרטיס SIM דיגיטלי: מתקינים אותו בטלפון עוד לפני הנסיעה, ונוחתים בחו״ל עם אינטרנט שעובד. כאן משווים את כל החבילות במקום אחד — לפי מחיר, כמה גלישה, לכמה זמן ואיזו רשת מקומית.',
    trustStrip: [
      { strong: 'הכול במקום אחד', rest: 'במקום לפתוח עשרה אתרים של ספקים' },
      { strong: 'המחיר בשקלים', rest: 'לצד הסכום שיחויב בכרטיס האשראי' },
      { strong: 'בלי דירוג בתשלום', rest: 'גובה העמלה שלנו לא משפיע על הסדר' },
    ],
  },
  search: {
    label: 'יעד הטיול',
    placeholder: 'לאן טסים?',
    submit: 'למצוא חבילה',
    clear: 'ניקוי היעד',
    suggestionsLabel: 'הצעות יעדים',
    noResults: 'לא מצאנו יעד כזה. נסו שם מדינה.',
    popularLabel: 'יעדים פופולריים:',
    daysFieldLabel: 'לכמה ימים?',
    whatIsEsim:
      'eSIM הוא כרטיס SIM דיגיטלי. מתקינים אותו בטלפון עוד לפני הנסיעה, ומגיעים לחו״ל עם אינטרנט שעובד — בלי לחפש חנות בשדה התעופה ובלי להחליף את הכרטיס הישראלי.',
    addAnother: 'הוספת יעד נוסף',
    daysLabelTemplate: 'ימים ב{country}',
    daysUnit: 'ימים',
    removeTemplate: 'הסרת {country}',
    multiTitleTemplate: 'eSIM ל{destinations}',
    coverageAll: 'מכסה את כל היעדים',
    coverageRegionTemplate: 'חבילה אזורית · {region}',
    coverageGlobal: 'חבילה גלובלית',
    coverageClaimTemplate: 'הספק מצהיר על {count} יעדים',
    coverageVerifiedTemplate: 'מתוכם {count} יעדים שאנחנו מאמתים',
    coverageVerifiedAllTemplate: '{count} יעדים, כולם מאומתים',
    noFullCoverage:
      'אף חבילה בודדת לא מכסה את כל היעדים שבחרתם. הצירוף למטה מכסה אותם יחד.',
    emptyTitle: 'לאן טסים?',
    emptyBody:
      'בחרו יעד אחד או יותר כדי להשוות חבילות. אפשר להוסיף כמה יעדים לאותו טיול — נמצא גם חבילה אחת שמכסה את כולם וגם צירוף זול יותר.',
    uncoveredTitleTemplate: 'אין לנו אף חבילה ל{destinations}',
    uncoveredBodyPartial:
      'בגלל היעד הזה אין חבילה אחת שמכסה את כל הטיול, וגם צירוף אינו אפשרי. אפשר להסיר אותו מהחיפוש ולראות מה קיים לשאר היעדים.',
    uncoveredBodyAll:
      'לא מצאנו אף חבילה — לא של המדינה, לא אזורית ולא גלובלית — שכוללת את היעדים שבחרתם. זה לא אומר שאין eSIM שם, אלא שהוא לא נמצא בקטלוג שלנו.',
    daysHint: 'כמה ימים בכל יעד? בלי זה נניח שבוע לכל אחד.',
    assumedDaysTemplate: 'הנחנו {days} ימים לכל יעד. עדכנו את הימים כדי לדייק.',
    chooseFirst: 'בחרו יעד כדי להשוות חבילות',
  },
  personalization: {
    trigger: 'שינוי הימים ואופן השימוש',
    optional: 'שתי השאלות האלה קובעות איזו חבילה מתאימה',
    title: 'על הטיול שלכם',
    note: 'בלי שתי התשובות האלה כל המלצה היא ניחוש. זה לוקח עשר שניות.',
    durationLabel: 'כמה ימים',
    usageLabel: 'למה תשתמשו באינטרנט?',
    submit: 'הצגת החבילות המתאימות',
    reset: 'איפוס',
    summaryPrefix: 'מותאם ל',
    durations: {
      short: '1–3',
      week: '4–7',
      twoWeeks: '8–14',
      month: '15–30',
    },
    usages: {
      navigation: 'ניווט והודעות בלבד',
      light: 'קל',
      regular: 'רגיל',
      heavy: 'כבד',
      hotspot: 'מודם לכל המכשירים',
      unlimited: 'ללא הגבלה',
    },
    usageHints: {
      navigation: 'Waze, WhatsApp, שיחות ומיילים — בלי גלישה ממושכת',
      light: 'הודעות, מפות, קצת גלישה ותמונות',
      regular: 'רשתות חברתיות, מפות, גלישה וצפייה מדי פעם',
      heavy: 'וידאו, שיחות וידאו, העלאת תמונות וסרטונים',
      hotspot: 'משתפים את החיבור למחשב ולעוד מכשירים — במקום אינטרנט קווי',
      unlimited: 'מעדיפים חבילה בלי הגבלת נפח ולא לספור GB',
    },
    // The number is ours, not a measurement, so it is shown rather than
    // applied quietly behind the recommendation.
    perDayTemplate: 'כ‑{amount} ליום לפי ההערכה שלנו',
    exactLabel: 'אני יודע/ת בדיוק כמה GB אני צריך/ה',
    exactHint: 'למשל אם החבילה משמשת כמודם קבוע, או אם כבר יש לכם צריכה ידועה',
    exactFieldLabel: 'כמה GB לכל הטיול?',
    exactPlaceholder: '20',
    totalTemplate: 'סה״כ להערכה: כ‑{gb}GB ל‑{days} ימים',
    totalStatedTemplate: 'ביקשתם {gb}GB ל‑{days} ימים',
    missingTitle: 'עוד שני פרטים ואפשר להתחיל',
    missingDestination: 'בחרו יעד',
    missingDays: 'מלאו כמה ימים לכל יעד',
    missingUsage: 'בחרו למה תשתמשו באינטרנט, או הזינו כמה GB',
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
        question: 'אפשר לשתף את האינטרנט עם עוד מכשיר?',
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
    tailoredStatedTemplate: 'מותאם ל‑{days} ימים · {gb}GB שביקשתם',
    legEstimateTemplate: '{country} · {days} {unit} ≈ {gb}GB',
    defaultEstimate: 'הערכה כללית בלבד — מלאו כמה ימים ולמה תשתמשו באינטרנט כדי לקבל המלצה אמיתית',
    change: 'שנה',
    showAllTemplate: 'הצגת עוד {count} חבילות',
    shortSectionTitle: 'חבילות קטנות מהצריכה שלכם',
    shortSectionBody:
      'החבילות האלה ייגמרו לפני סוף הטיול לפי מה שהגדרתם, ולכן הן לא מדורגות מול החבילות שלמעלה. הן כאן כי לפעמים מודעים לזה ובוחרים בהן בכל זאת — למשל אם מתכננים להיות רוב הזמן על Wi‑Fi.',
    noneCoverNeed:
      'אף חבילה בקטלוג שלנו לא מגיעה לכמות הגלישה שהגדרתם ליעד הזה. כל מה שמופיע למטה ייגמר לפני סוף הטיול.',
    empty: 'אין עדיין חבילות ליעד הזה.',
  },
  plan: {
    // Every label here is a question a traveller actually asks. "נפח" and
    // "תוקף" are what the industry calls these fields; they are not what
    // someone buying their first eSIM would call them.
    data: 'כמה גלישה',
    validity: 'לכמה זמן',
    network: 'רשת מקומית',
    networkUnknown: 'הספק לא פרסם את הרשת ביעד הזה',
    price: 'מחיר',
    view: 'מעבר לאתר הספק',
    viewAtTemplate: 'מעבר לאתר {provider}',
    details: 'עוד פרטים',
    buyAtProvider: 'לא משלמים כאן — הרכישה מתבצעת באתר הספק',
    prototypeLink: 'אב־טיפוס — הקישור לספק עדיין לא פעיל',
    opensInNewTab: '(נפתח בלשונית חדשה, באתר הספק)',
    hotspot: 'שיתוף אינטרנט',
    noHotspot: 'בלי שיתוף אינטרנט',
    calls: 'שיחות טלפון',
    noCalls: 'בלי שיחות טלפון',
    sms: 'הודעות SMS',
    noSms: 'בלי הודעות SMS',
    topUp: 'אפשר להוסיף גלישה',
    fiveG: 'רשת מהירה 5G',
    no5g: 'בלי רשת 5G',
    dataDaysTemplate: 'בערך {days} ימים לפי השימוש שבחרתם',
    dataDaysOneTemplate: 'בערך יום אחד לפי השימוש שבחרתם',
    unlimitedNote: 'גלישה בלי הגבלת נפח',
    perGbTemplate: '{price} לכל GB',
    perDayTemplate: '{price} ליום',
    approxTemplate: '≈ {price}',
    chargedInTemplate: 'החיוב אצל הספק מתבצע ב־{currency}',
    fxNoteTemplate: 'שער {rate} · נתוני הדגמה מ־{date}',
    estimateOnly: 'הערכה בלבד',
    conversionNote:
      'המחיר בשקלים הוא המרה משוערת. הספק גובה במטבע שלו, וחברת האשראי עשויה להמיר בשער אחר ולהוסיף עמלת מטבע חוץ.',
    conversionRateTemplate: 'שערי ההמרה: {rates} · נתוני הדגמה מ־{date}',
    conversionSummary: 'איך חישבנו את המחיר בשקלים',
    maxCompareShort: 'עד 3 חבילות',
    chargedHereTemplate: 'מחויב ב־{currency}',
    youPayLabel: 'המחיר לכם, בשקלים (בערך)',
    chargedLabel: 'מה שיופיע בכרטיס האשראי',
    chargedExplains: 'הספק גובה במטבע שלו. חברת האשראי ממירה בשער שלה ולרוב מוסיפה עמלת מטבע חוץ, אז הסכום בשקלים עשוי להיות שונה במעט.',
    belowNeed: 'מתחת לצריכה הצפויה',
    coversTripTemplate: 'מכסה {days} ימי טיול',
    shortValidity: 'קצר מהטיול שהוגדר',
    fairUsage: 'בלי הגבלת נפח — אבל יש תקרה יומית',
    fairUsageDetailTemplate: 'מהירות מלאה עד {gb}GB ביום, ולאחר מכן האטה ל־{kbps}kbps.',
    couponTemplate: 'קוד {code} · חיסכון {amount}',
    compareLabel: 'סמנו להשוואה',
    comparingLabel: 'נבחר להשוואה',
    demoCoupon: 'קוד הדגמה',
  },
  details: {
    title: 'פרטי החבילה',
    sms: 'הודעות SMS',
    topUp: 'טעינה חוזרת',
    activation: 'אופן התקנה',
    activationValues: { qr: 'קוד QR', app: 'אפליקציה', both: 'קוד QR או אפליקציה' },
    fairUsageTitle: 'מדיניות שימוש הוגן',
    whyTitle: 'למה החבילה מדורגת כך',
    scoreTemplate: 'ציון התאמה {score} מתוך 100',
    factors: {
      needFit: 'מכסה את הצריכה הצפויה',
      price: 'מחיר יחסית לחבילות האחרות',
      headroom: 'נפח מעבר לצפוי',
      features: 'מה כלול (רשת 5G, שיתוף אינטרנט, הוספת גלישה)',
    },
    noCommission: 'הדירוג מחושב מהנתונים שלמעלה בלבד. גובה העמלה אינו אחד מהם.',
    close: 'סגירת הפרטים',
  },
  recommendations: {
    bestValue: 'הכי משתלם',
    cheapest: 'הכי זול',
    bestForBrowsing: 'הכי טוב לגלישה',
    bestUnlimited: 'הכי טוב ללא הגבלה',
    browsingNote:
      'נקבע לפי רשת 5G, מספר הרשתות המקומיות, שיתוף אינטרנט וכמות הגלישה — לא לפי מדידת כיסוי בשטח.',
  },
  filters: {
    categoriesLabel: 'קטגוריות מומלצות',
    resultsLabel: 'תוצאות ההשוואה',
    trayLabel: 'חבילות שנבחרו להשוואה',
    open: 'סינון ומיון',
    title: 'סינון ומיון',
    sort: 'מיון',
    sortOptions: {
      recommended: 'מומלץ',
      price: 'מחיר נמוך לגבוה',
      pricePerGb: 'מחיר לכל GB',
      data: 'כמות גלישה',
      validity: 'לכמה זמן',
    },
    data: 'כמה גלישה',
    validity: 'לכמה זמן',
    network: 'רשת מקומית',
    onlyFiveG: 'רק עם רשת 5G',
    features: 'מה כלול',
    providers: 'ספקים',
    price: 'מחיר מרבי',
    clearAll: 'ניקוי הכול',
    showResultsTemplate: 'הצג {count} תוצאות',
    activeTemplate: '{count} מסננים פעילים',
    noResults: 'אין חבילות שמתאימות לסינון. נסו להסיר מסנן.',
    daysTemplate: '{days} ימים',
    daysPlusTemplate: '{days} ימים+',
  },
  combination: {
    badge: 'צירוף חבילות',
    titleTemplate: 'צירוף של {count} חבילות',
    note: 'שתי רכישות נפרדות אצל שני ספקים, כל אחת בהתקנה משלה.',
    total: 'סך הכול',
    legTemplate: 'עבור {countries}',
    cheaperTemplate: 'זול ב־{amount} מהחבילה הזולה ביותר שמכסה את הכול',
    dearerTemplate: 'יקר ב־{amount} מהחבילה הזולה ביותר שמכסה את הכול',
    onlyOption: 'זו הדרך היחידה לכסות את כל היעדים שבחרתם',
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
      price: 'המחיר לכם, בשקלים (בערך)',
      sourcePrice: 'מה שיופיע בכרטיס האשראי',
      data: 'כמה גלישה',
      validity: 'לכמה זמן',
      perUnit: 'מחיר לכל GB',
      network: 'רשת מקומית',
      technology: 'רשת מהירה 5G',
      hotspot: 'שיתוף אינטרנט',
      calls: 'שיחות טלפון',
      sms: 'הודעות SMS',
      topUp: 'אפשר להוסיף גלישה',
      fairUsage: 'מדיניות שימוש הוגן',
    },
    differsLabel: 'שונה בין החבילות',
  },
  country: {
    titleTemplate: 'eSIM ל{country}',
    seoTitleTemplate: 'eSIM ל{country} — השוואת מחירים וחבילות',
    metaDescriptionTemplate:
      'השוואת חבילות eSIM ל{country}: מחיר, נפח גלישה, תוקף, רשת מקומית ו‑5G — מכל הספקים במקום אחד.',
    factsTitle: 'מידע פרקטי',
    factsNote: 'כל התשובות כאן מחושבות מהחבילות שבעמוד — לא נכתבו מראש.',
    facts: {
      worksQuestion: 'האם eSIM עובד ב{country}?',
      worksAnswerTemplate:
        'כן. מצאנו {plans} חבילות eSIM ל{country} מ־{providers} ספקים. כל החבילות ברשימה מיועדות ליעד הזה, ופועלות על רשתות מקומיות.',
      networksQuestion: 'אילו רשתות זמינות?',
      networksAnswerTemplate: 'החבילות שהשווינו פועלות על {operators}. הרשת של כל חבילה מצוינת בשורה שלה.',
      networksUnknownAnswer:
        'אין לנו את רשימת הרשתות ביעד הזה. החבילות שבעמוד הן אזוריות או גלובליות, והספקים שלהן לא פרסמו איזו רשת מקומית הן משתמשות בה כאן. אנחנו מעדיפים לומר שאיננו יודעים על פני לנחש.',
      dataQuestion: 'כמה GB כדאי לטיול?',
      dataAnswerTemplate:
        'לטיול של {days} ימים: כ־{light}GB לשימוש קל, כ־{regular}GB לשימוש רגיל וכ־{heavy}GB לשימוש כבד. זו הערכה המבוססת על צריכה יומית ממוצעת, לא הבטחה.',
      fiveGQuestion: 'האם יש 5G?',
      fiveGAnswerTemplate: '{count} מתוך {total} חבילות כוללות 5G, על {operators}.',
      fiveGNoneAnswer: 'אף אחת מהחבילות שהשווינו ליעד הזה לא כוללת 5G.',
      fiveGUnknownAnswer:
        'לא ידוע. בלי רשימת הרשתות ביעד הזה אי אפשר לדעת אילו חבילות תומכות ב‑5G, ולא ננחש.',
      hotspotQuestion: 'אפשר לשתף את האינטרנט עם עוד מכשיר?',
      hotspotAnswerTemplate:
        '{count} מתוך {total} חבילות מאפשרות שיתוף אינטרנט. בכל שורה מצוין במפורש אם החבילה תומכת ואם לא.',
      hotspotNoneAnswer: 'אף אחת מהחבילות שהשווינו ליעד הזה לא מאפשרת שיתוף אינטרנט.',
      worksAnswerBroadTemplate:
        'כן. אין חבילה שנמכרת ל{country} בלבד, אבל מצאנו {plans} חבילות אזוריות וגלובליות מ־{providers} ספקים ש{country} נמצאת ברשימת היעדים שלהן.',
    },
    backToSearch: 'חיפוש יעד אחר',
    coverage: {
      broadOnlyTitleTemplate: 'אין חבילה שנמכרת ל{country} בלבד',
      broadOnlyBody:
        'החבילות שלמטה הן חבילות אזוריות או גלובליות שהיעד הזה נמצא ברשימת היעדים שלהן. הן עובדות שם בדיוק כמו חבילת מדינה, רק שהן נמכרות לכמה מדינות יחד — ולכן לרוב יקרות יותר לטיול ליעד אחד.',
      noneTitleTemplate: 'עדיין אין לנו חבילה ל{country}',
      noneBody:
        'לא מצאנו אף חבילה — לא של המדינה, לא אזורית ולא גלובלית — שכוללת את היעד הזה. זה לא אומר שאין eSIM ל{country}; זה אומר שהוא לא נמצא בקטלוג שלנו.',
      noneStatusTemplate:
        'הקטלוג הנוכחי מכסה {covered} יעדים מתוך {total} שאפשר לחפש כאן, והוא מבוסס על נתוני הדגמה בלבד. כשנתחבר לספקים אמיתיים הכיסוי יילקח מהקטלוג שלהם.',
      noneAlternativesTitle: 'בינתיים אפשר להשוות ליעדים האלה',
    },
  },
  accessibility: {
    navLabel: 'הצהרת נגישות',
    title: 'הצהרת נגישות',
    intro:
      'אנחנו רואים בנגישות האתר חלק מהמוצר ולא תוספת לו. העמוד הזה מפרט מה נעשה, לפי איזה תקן, מה עדיין לא נגיש ואיך אפשר לדווח על בעיה.',
    pendingBadge: 'טיוטה — טרם הושלמה',
    pendingNotice:
      'ההצהרה הזו היא שלד. הפרטים המסומנים כ«טרם הוגדר» חייבים להתמלא לפני עליית האתר לאוויר, ואין להסתמך עליה עד אז.',
    notSet: 'טרם הוגדר',
    standardTitle: 'התקן שלפיו נבנה האתר',
    standardTemplate:
      'האתר נבנה לפי {standard}, המאמץ את הנחיות {basis} ברמת התאמה {level}.',
    standardNote:
      'התאמה לתקן אינה זהה לאישור נגישות. אישור ניתן על ידי מורשה נגישות שירות מוסמך.',
    entityTitle: 'מפעיל האתר',
    reviewedTitle: 'מועד הבדיקה האחרונה',
    auditorTitle: 'מי ביצע את בדיקת הנגישות',
    auditorTemplate: '{name}, מורשה נגישות שירות, רישיון מספר {licence}',
    doneTitle: 'מה נעשה עד היום',
    done: [
      'ניווט מלא במקלדת בכל מסלול החיפוש וההשוואה, כולל חיווי פוקוס נראה בכל רכיב.',
      'בדיקת ניגודיות אוטומטית שנכשלת אם צבע טקסט יורד מתחת ליחס 4.5:1.',
      'בדיקת axe-core בשבעה מצבים של האתר מול WCAG 2.0/2.1/2.2 ברמות A ו‑AA.',
      'תצוגה תקינה ברוחב 320 פיקסלים ובהגדלת טקסט ל‑200%, ללא גלילה אופקית.',
      'יעדי מגע של 44 פיקסלים לפחות ברכיבי המגע המרכזיים.',
      'חלונות מודאליים מבוססי <dialog> — מלכודת פוקוס, מקש Escape והשבתת הרקע מגיעים מהדפדפן.',
      'כיבוד העדפת המערכת להפחתת תנועה.',
      'מבנה כותרות סמנטי, שמות נגישים לכל פקד, וטקסט חלופי לכל אלמנט לא־טקסטואלי.',
    ],
    limitationsTitle: 'מה עדיין לא נגיש',
    limitations: [
      'האתר טרם נבדק עם קוראי מסך (NVDA, VoiceOver, JAWS), ובפרט לא נבדקה הקראת טקסט עברי המשולב במספרים ובמונחים באנגלית.',
      'האתר לא נבדק על ידי מורשה נגישות שירות ולא נבחן עם משתמשים בעלי מוגבלות.',
      'האתר נמצא בפיתוח והנתונים המוצגים בו הם נתוני הדגמה.',
    ],
    contactTitle: 'דיווח על בעיית נגישות',
    contactIntro:
      'נתקלתם ברכיב שאינו נגיש? נשמח לדעת. פנייה בנושא נגישות תיענה בהקדם, ובכל מקרה בתוך פרק הזמן המצוין למטה.',
    coordinatorLabel: 'רכז נגישות',
    phoneLabel: 'טלפון',
    emailLabel: 'דוא״ל',
    addressLabel: 'כתובת למשלוח דואר',
    responseLabel: 'זמן תגובה',
    responseTemplate: 'עד {days} ימי עסקים',
    updatedTemplate: 'עודכן לאחרונה: {date}',
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
