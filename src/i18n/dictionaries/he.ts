/**
 * Hebrew dictionary — the source of truth for the copy and for the
 * `Dictionary` type. Every other locale must satisfy this shape.
 */
export const he = {
  meta: {
    siteName: 'יש קליטה?',
    tagline: 'השוואת חבילות eSIM לחו״ל',
    defaultDescription:
      'משווים חבילות eSIM לחו״ל לפי יעד, מחיר, נפח גלישה, תוקף ורשת — ובוחרים את החבילה שמתאימה לטיול.',
    // Read aloud when the share card cannot be loaded or seen.
    shareImageAlt: 'יש קליטה? — השוואת חבילות eSIM לחו״ל. משווים אצלנו, רוכשים ישירות מהספק.',
  },
  brand: {
    // The visible wordmark, question mark included: it is the brand.
    name: 'יש קליטה?',
    // The accessible name of the logo link. It opens with the visible
    // wordmark verbatim, which is what WCAG 2.5.3 (Label in Name) asks for,
    // and then says what the site is — so a screen-reader user who lands on
    // the logo learns the same thing a sighted user learns from the tagline.
    logoAlt: 'יש קליטה? — השוואת חבילות eSIM לחו״ל',
    homeLabel: 'לדף הבית',
  },
  nav: {
    label: 'ניווט ראשי',
    compare: 'השוואת eSIM',
    howItWorks: 'איך זה עובד',
    faq: 'שאלות נפוצות',
    devices: 'תאימות מכשירים',
    destinations: 'כל היעדים',
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
      'יש קליטה? — אתר השוואה עצמאי לחבילות eSIM לחו״ל. אנחנו לא מוכרים ולא מנפיקים חבילות eSIM; ההשוואה כאן חינם, והרכישה מתבצעת ישירות אצל הספק שתבחרו.',
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
  disclosurePage: {
    title: 'גילוי נאות',
    intro:
      'יש קליטה? הוא אתר השוואה עצמאי. אנחנו לא מוכרים ולא מנפיקים חבילות eSIM, והרכישה מתבצעת תמיד ישירות אצל הספק.',
    sections: [
      {
        heading: 'איך אנחנו מתפרנסים',
        body: [
          'חלק מהקישורים לספקים הם קישורי שותפים. אם תרכשו דרכם, ייתכן שנקבל עמלה מהספק — בלי שתשלמו על כך שקל נוסף, ובלי שהמחיר אצל הספק ישתנה.',
          'לא כל ספק באתר הוא שותף שלנו, וספקים שאינם משלמים לנו מוצגים באותה צורה בדיוק.',
        ],
      },
      {
        heading: 'למה העמלה לא משפיעה על הדירוג',
        body: [
          'זו לא הבטחה אלא מבנה: המודל שבו נשמרת כל חבילה באתר אינו כולל שדה עמלה, שדה תשלום או שדה דירוג ידני. אלגוריתם הדירוג מקבל רק את נתוני החבילה ואת פרטי הטיול שמסרתם, ולכן אין לו דרך לדעת כמה ספק משלם לנו — גם אם מישהו היה רוצה בכך.',
          'הסדר נקבע לפי מחיר, התאמה לכמות הגלישה שהערכנו לטיול שלכם, עודף גלישה ותוספות. ההסבר המלא נמצא בעמוד התוצאות, מתחת לבורר המיון.',
        ],
      },
      {
        heading: 'קודי הנחה',
        body: [
          'אם ספק נותן לנו קוד הנחה לגולשי האתר, גם הקוד משויך אלינו, כמו קישורי השותפים, ורכישה איתו יכולה לזכות אותנו בעמלה.',
          'כשהקוד פתוח לכל אחד, המחיר שמוצג ומדורג הוא המחיר אחרי ההנחה, והמחיר המקורי מופיע לידו. כשהקוד מיועד רק ללקוחות חדשים של הספק, המחיר והדירוג נשארים לפי המחיר הרגיל, והקוד מופיע לצדו.',
          'קוד לא נותן לספק שום עדיפות מעבר להנחה עצמה, וכל קוד מוצג באותה צורה. קוד שפג תוקפו יורד מהאתר ביום שהוא פג.',
        ],
      },
      {
        heading: 'מה אנחנו לא עושים',
        body: [
          'איננו מקדמים ספק בתשלום, לא מוכרים מקומות בראש הרשימה, ולא מסתירים ספק שלא עובד איתנו.',
          'איננו ממציאים מחירים, דירוגים או יכולות של ספקים. נתון שאיננו יכולים לאמת מסומן ככזה או שאינו מוצג.',
        ],
      },
    ],
  },
  mockData: {
    badge: 'נתוני הדגמה',
    short: 'המחירים כאן אינם אמיתיים — האתר לפני השקה.',
    mixedShort: 'חלק מהמחירים בעמוד הזה אינם אמיתיים.',
    mixedNotice:
      'חלק מהחבילות בעמוד הזה הן נתוני הדגמה ומסומנות ככאלה. השאר מגיעות מהספק עצמו. אין להסתמך על המחירים המסומנים כהדגמה לרכישה.',
    more: 'מה זה אומר?',
    notice:
      'המחירים והנתונים באתר הם נתוני הדגמה, ואינם הצעות אמיתיות של אף ספק. האתר לפני השקה, והמחירים האמיתיים ייכנסו עם חיבור הקטלוגים של הספקים. אין להסתמך על המספרים הנוכחיים לרכישה.',
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
    // The H1 is two lines: the brand, then what the site does. Splitting them
    // means a search engine and a screen reader both get "יש קליטה?
    // השוואת חבילות eSIM לחו״ל" as one heading, while the page still opens
    // with the question a traveller actually asks on landing.
    heroTitle: 'יש קליטה?',
    heroDescriptor: 'השוואת חבילות eSIM לחו״ל',
    heroSubtitle:
      'משווים חבילות eSIM לחו״ל במקום אחד ובוחרים את החבילה שמתאימה לטיול שלכם.',
    trustStrip: [
      { strong: 'הכול במקום אחד', rest: 'במקום לפתוח עשרה אתרים של ספקים' },
      { strong: 'המחיר בשקלים', rest: 'לצד הסכום שיחויב בכרטיס האשראי' },
      { strong: 'בלי דירוג בתשלום', rest: 'גובה העמלה שלנו לא משפיע על הסדר' },
    ],
  },
  search: {
    label: 'יעד הטיול',
    placeholder: 'לאן טסים?',
    submit: 'השוו חבילות',
    clear: 'ניקוי היעד',
    suggestionsLabel: 'הצעות יעדים',
    noResults: 'לא מצאנו יעד כזה. נסו שם מדינה.',
    popularLabel: 'יעדים פופולריים:',
    recentLabel: 'חיפושים אחרונים',
    popularGroupLabel: 'יעדים פופולריים',
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
    pendingTitle: 'שינית את הטיול. התוצאות למטה עדיין מציגות את החיפוש הקודם.',
    pendingApply: 'עדכון התוצאות',
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
    conversionRateLiveTemplate: 'שערי ההמרה: {rates} · הבנק המרכזי האירופי, {date}',
    conversionRateFallbackTemplate: 'שערי ההמרה: {rates} · שערי גיבוי מ־{date}. לא שער חי.',
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
    // A code a provider issued for this site's visitors. {percent} is "15%",
    // {code} the code itself, {amount} what it saves on this plan.
    sitePromoTemplate: '{percent} הנחה לגולשי האתר',
    firstPurchasePromoTemplate: '{percent} הנחה ברכישה ראשונה',
    promoCodeTemplate: 'קוד {code}',
    promoInLink: 'ההנחה כבר כלולה בקישור',
    promoSavingTemplate: 'חיסכון {amount}',
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
    recommendedSummary: 'לפי מה מסודר המיון ״מומלץ״?',
    recommendedNote:
      'המחיר הוא הגורם הכבד ביותר (כ‑52%), אחריו ההתאמה לכמות הגלישה שהערכנו לטיול שלכם (28%), עודף גלישה מעבר לצורך (12%) ותוספות כמו 5G, שיתוף אינטרנט וטעינה חוזרת (8%). חבילה שתוקפה קצר מהטיול, או שמגבילה את המהירות מוקדם, יורדת בהתאם. גובה העמלה שאנחנו מקבלים אינו נכנס לחישוב בשום שלב.',
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
    legChargedTemplate: 'הספק גובה {amount}',
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
    seoTitleTemplate: 'eSIM ל{country} – השוואת חבילות ומחירים',
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
      'חסרה כאן דרך פנייה בנושא נגישות, ולכן ההצהרה אינה שלמה. כל השאר בעמוד הזה מדויק ומעודכן.',
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
      'נתקלתם ברכיב שאינו נגיש? נשמח לדעת — זה הדיווח שהכי עוזר לנו לתקן.',
    coordinatorLabel: 'רכז נגישות',
    phoneLabel: 'טלפון',
    emailLabel: 'דוא״ל',
    addressLabel: 'כתובת למשלוח דואר',
    responseLabel: 'זמן תגובה',
    operatorIndividual: 'אדם פרטי. האתר אינו מופעל על ידי חברה או עוסק רשום.',
    notRequiredAudit: 'אישור מורשה נגישות שירות אינו נדרש לאתר אינטרנט לפי תקנה 35.',
    notRequiredCoordinator: 'חובת מינוי רכז נגישות חלה על ארגון המעסיק 25 עובדים ומעלה.',
    noContactYet:
      'טרם פורסמה כאן דרך פנייה, ולכן ההצהרה אינה שלמה. עד שתפורסם — אין להסתמך על העמוד הזה.',
    responseTemplate: 'עד {days} ימי עסקים',
    updatedTemplate: 'עודכן לאחרונה: {date}',
  },
  preview: {
    navTitle: 'תצוגה מוקדמת',
    heading: 'החלק הזה עדיין סגור',
    body: 'עמודי ההשוואה מציגים נתוני הדגמה — מחירים שנוצרו לצורך פיתוח, שאינם הצעות אמיתיות של אף ספק. לכן הם עדיין לא מפורסמים.',
    invite: 'קיבלתם סיסמה? הזינו אותה כאן.',
    label: 'סיסמה',
    submit: 'כניסה',
    error: 'הסיסמה שגויה. נסו שוב.',
    back: 'חזרה לדף הבית',
    publicHint: 'שאר האתר פתוח ומסביר מה הכלי עושה.',
  },
  /**
   * The device-compatibility page.
   *
   * Menu names appear twice on purpose: in Hebrew as a Hebrew-language phone
   * shows them, and in Latin in brackets as the manufacturer's own support
   * page writes them. The Latin spelling is the one that is sourced, and it
   * is also what a reader whose phone is set to English will actually see.
   */
  devicesPage: {
    navLabel: 'תאימות מכשירים',
    title: 'האם המכשיר שלכם תומך ב‑eSIM?',
    intro:
      'חבילת eSIM נטענת על שבב שמובנה בתוך המכשיר. אם השבב הזה לא קיים — אי אפשר להתקין את החבילה, וגם לא לקבל עליה החזר בקלות. לכן כדאי לבדוק לפני הרכישה, ולא אחריה.',
    updatedTemplate: 'הרשימות כאן הועתקו מדפי התמיכה של היצרנים ונבדקו בתאריך {date}.',
    staleNote:
      'דגם שיצא אחרי התאריך הזה לא יופיע כאן עדיין. במקרה כזה הבדיקה במכשיר עצמו היא התשובה הנכונה.',
    check: {
      title: 'הבדיקה הבטוחה ביותר נמצאת במכשיר עצמו',
      intro:
        'רשימת דגמים יכולה להטעות: אותו דגם בדיוק, שנקנה במדינה אחרת, לפעמים יוצא בלי שבב eSIM. סמסונג כותבת את זה במפורש. התפריט במכשיר שלכם לא יכול לטעות.',
      supportTitle: 'איך בודקים אם יש תמיכה',
      installTitle: 'איך מתקינים חבילה שקניתם',
      guides: [
        {
          id: 'ios',
          title: 'אייפון ואייפד',
          supportSteps: [
            'פותחים את אפליקציית ההגדרות (Settings).',
            'נכנסים ל״כללי״ (General) ואז ל״אודות״ (About).',
            'גוללים למטה ומחפשים שורה בשם EID. זהו המספר המזהה של שבב ה‑eSIM: אם השורה קיימת — יש במכשיר שבב eSIM. אם היא לא קיימת — אין.',
          ],
          installSteps: [
            'פותחים הגדרות (Settings) ונכנסים ל״סלולרי״ (Cellular).',
            'מקישים על ״הגדרת סלולרי״ או ״הוספת eSIM״ (Set Up Cellular / Add eSIM).',
            'בוחרים את השיטה שהספק נתן לכם: סריקת קוד QR, קישור התקנה, או הזנה ידנית של הפרטים.',
            'ההתקנה דורשת חיבור Wi‑Fi. לכן כדאי להתקין את החבילה עוד בבית, לפני הטיסה, ולא בשדה התעופה בחו״ל.',
          ],
        },
        {
          id: 'samsung',
          title: 'סמסונג גלקסי',
          supportSteps: [
            'פותחים הגדרות (Settings).',
            'נכנסים ל״חיבורים״ (Connections) ואז ל״מנהל SIM״ (SIM manager).',
            'אם מופיעה שם האפשרות ״הוספת eSIM״ (Add eSIM) — המכשיר תומך. אם התפריט מציג רק כרטיס SIM פיזי — הדגם הזה, כפי שנמכר במדינה שבה נקנה, אינו תומך.',
          ],
          installSteps: [
            'נכנסים להגדרות (Settings) ואז ל״חיבורים״ (Connections) ואז ל״מנהל SIM״ (SIM manager).',
            'מקישים על ״הוספת eSIM״ (Add eSIM).',
            'סורקים את קוד ה‑QR שקיבלתם מהספק, או מזינים את הפרטים ידנית.',
            'גם כאן ההתקנה דורשת Wi‑Fi — עדיף לעשות אותה לפני הנסיעה.',
          ],
        },
        {
          id: 'pixel',
          title: 'גוגל פיקסל',
          supportSteps: [
            'פותחים הגדרות (Settings).',
            'נכנסים ל״רשת ואינטרנט״ (Network & internet) ואז ל״כרטיסי SIM״ (SIMs).',
            'אם מופיעה האפשרות ״הוספת SIM״ (Add SIM) ובתוכה ״הגדרת eSIM״ (Set up an eSIM) — יש תמיכה.',
          ],
          installSteps: [
            'נכנסים להגדרות (Settings) ואז ל״רשת ואינטרנט״ (Network & internet) ואז ל״כרטיסי SIM״ (SIMs).',
            'מקישים על ״הוספת SIM״ (Add SIM) ואז על ״הגדרת eSIM״ (Set up an eSIM).',
            'בוחרים את הספק ועוקבים אחרי ההוראות שעל המסך.',
            'גם כאן צריך Wi‑Fi. מתקינים לפני הטיסה.',
          ],
        },
      ],
    },
    other: {
      title: 'מותג אחר — שיאומי, מוטורולה, וואן פלוס, אונור',
      body: [
        'אין רשימה רשמית אחת שמכסה את כל היצרנים, ואנחנו לא מפרסמים רשימה שלא הצלחנו לאמת מול היצרן עצמו.',
        'הבדיקה שעובדת כמעט בכל מכשיר אנדרואיד: הגדרות ← רשת ואינטרנט ← כרטיסי SIM. אם יש שם אפשרות להוסיף eSIM — יש תמיכה.',
        'דרך מהירה נוספת: מחייגים ⁦*#06#⁩ במקלדת החיוג. המסך מציג את מזהי המכשיר, ואם מופיע ביניהם EID — במכשיר יש שבב eSIM.',
      ],
    },
    lock: {
      title: 'עוד חסם שכדאי לבדוק: טלפון נעול למפעיל',
      body: [
        'מכשיר שנרכש במסגרת הסדר מול חברת סלולר עלול להיות נעול אליה. במקרה כזה חבילה של ספק אחר לא תעבוד, גם אם יש במכשיר שבב eSIM תקין.',
        'באייפון בודקים כך: הגדרות ← כללי ← אודות, ומחפשים את השורה ״נעילת מפעיל״ (Carrier Lock). אם כתוב לידה ״אין הגבלות SIM״ (No SIM Restrictions) — המכשיר פתוח.',
        'באנדרואיד אין מקום אחיד לבדוק את זה, וצריך לשאול את חברת הסלולר שממנה נרכש המכשיר.',
      ],
    },
    list: {
      title: 'רשימת הדגמים',
      intro:
        'הרשימות מכסות את אפל, סמסונג וגוגל, ומועתקות מדפי התמיכה שלהן. אפשר לחפש בעברית — למשל ״אייפון 13״ או ״גלקסי S21״.',
      searchLabel: 'חיפוש דגם',
      searchPlaceholder: 'אייפון 13, גלקסי S21, פיקסל 8…',
      clear: 'ניקוי החיפוש',
      resultsTemplate: '{count} דגמים ברשימה',
      oneResult: 'דגם אחד ברשימה',
      noResults: 'לא נמצא דגם בשם הזה.',
      noResultsHint:
        'זה לא אומר שהמכשיר לא תומך — הרשימות כאן מכסות רק אפל, סמסונג וגוגל. בדקו בתפריט המכשיר לפי ההוראות שלמעלה.',
      sourceTemplate: 'מקור: {source}, נבדק ב‑{date}',
      sourceLabels: {
        appleIphone: 'אפל — eSIM באייפון',
        appleIpad: 'אפל — eSIM באייפד',
        appleModels: 'אפל — זיהוי דגמי אייפון',
        samsung: 'סמסונג — eSIM בגלקסי',
        pixel: 'גוגל — שני כרטיסי SIM בפיקסל',
      },
      opensInNewTab: '(נפתח בלשונית חדשה, באתר היצרן)',
    },
    support: {
      yes: 'תומך',
      regional: 'תלוי במדינת הרכישה',
      no: 'לא תומך',
    },
    supportHint: {
      yes: 'היצרן מציג את הדגמים האלה כתומכים ב‑eSIM.',
      regional: 'היצרן מציג את הדגמים האלה כתומכים רק בחלק מהשווקים. חובה לבדוק במכשיר עצמו.',
      no: 'הדגמים האלה נמצאים מחוץ לתמיכה שהיצרן מפרסם. חבילת eSIM לא תעבוד עליהם.',
    },
    brands: {
      apple: 'אפל',
      samsung: 'סמסונג',
      google: 'גוגל',
    },
    kinds: {
      phone: 'טלפונים',
      tablet: 'טאבלטים',
    },
    groupTitles: {
      'apple-iphone-supported': 'אייפון — תומכים ב‑eSIM',
      'apple-iphone-unsupported': 'אייפון — ללא תמיכה ב‑eSIM',
      'apple-ipad-supported': 'אייפד — דגמי Wi‑Fi + Cellular',
      'samsung-galaxy-s': 'גלקסי S',
      'samsung-galaxy-z': 'גלקסי Z — מתקפלים',
      'samsung-galaxy-a': 'גלקסי A',
      'samsung-xcover': 'גלקסי XCover',
      'samsung-tab': 'גלקסי Tab',
      'pixel-supported': 'פיקסל — תומכים ב‑eSIM',
      'pixel-outside-rule': 'פיקסל — דורות מוקדמים',
    },
    notes: {
      chinaMainland:
        'מכשיר שנרכש בסין היבשתית הוא מקרה נפרד: אפל מציינת שרק iPhone 18 Pro, iPhone 18 Pro Max, iPhone 17e ו‑iPhone Air תומכים שם ב‑eSIM.',
      hongKongMacao:
        'בהונג קונג ובמקאו חלק מדגמי האייפון נמכרים עם שני כרטיסי SIM פיזיים במקום eSIM.',
      samsungOrigin:
        'סמסונג כותבת במפורש: בהתאם למדינה שבה נרכש המכשיר, ייתכן שלא תהיה תמיכה ב‑eSIM גם בדגם שמופיע ברשימה.',
      samsungARegion:
        'בסדרת A התמיכה מוגבלת לשווקים מסוימים — אירופה, צפון אמריקה וקוריאה (ובדגם A54 גם יפן).',
      pixelDualEsim:
        'ב‑Pixel 7 ואילך אפשר להחזיק שני פרופילי eSIM פעילים במקביל, אם חברת הסלולר מאפשרת זאת.',
      pixelOutsideRule:
        'ההנחיה של גוגל מכסה את Pixel 3a ואילך. הדורות שלפניו נמצאים מחוץ להנחיה הזו, ואנחנו לא מציגים עליהם קביעה שלא אימתנו.',
    },
    cta: {
      title: 'המכשיר תומך? אפשר להשוות חבילות',
      body: 'בוחרים יעד ומספר ימים, ורואים אילו חבילות מתאימות לטיול.',
      link: 'להשוואת חבילות',
    },
  },

  /**
   * Trip extras. Car rental is the first and, for now, the only one.
   *
   * The wording is a question, not a pitch: the offer appears after the
   * traveller has already left for the provider, so its job is to be useful
   * on the way back, not to interrupt anything.
   */
  tripExtras: {
    heading: 'עוד דבר אחד לטיול',
    esimChosen: 'נבחרה חבילת eSIM',
    carRental: {
      questionTemplate: 'צריכים גם רכב שכור ב{country}?',
      questionGeneric: 'צריכים גם רכב שכור לנסיעה?',
      body: 'השוו מחירי השכרת רכב ביעד שלכם.',
      accept: 'השוואת רכבים',
      decline: 'לא תודה',
      opensInNewTab: '(נפתח בלשונית חדשה, החיפוש שלכם נשאר פתוח כאן)',
      dismiss: 'סגירת ההצעה',
    },
  },
  carRentalPage: {
    navLabel: 'השכרת רכב',
    title: 'השוואת מחירי השכרת רכב',
    intro:
      'אנחנו לא משכירים רכב ולא מוכרים ביטוח. זו השוואה בלבד, וההזמנה מתבצעת תמיד ישירות אצל חברת ההשכרה או אצל המתווך.',
    countryKnownTemplate: 'היעד שהזנתם: {country}.',
    needPickup:
      'את המדינה אנחנו יודעים מהחיפוש שלכם, אבל לא את העיר — לכן צריך לבחור מאיפה אוספים את הרכב.',
    form: {
      title: 'פרטי ההשכרה',
      country: 'מדינה',
      countryPlaceholder: 'בחרו מדינה',
      pickupLocation: 'מקום איסוף',
      pickupPlaceholder: 'עיר, שדה תעופה או כתובת',
      pickupKind: 'סוג מקום האיסוף',
      sameDropoff: 'מחזירים את הרכב באותו מקום',
      dropoffLocation: 'מקום החזרה',
      dropoffPlaceholder: 'עיר, שדה תעופה או כתובת',
      pickupDate: 'תאריך איסוף',
      pickupTime: 'שעת איסוף',
      dropoffDate: 'תאריך החזרה',
      dropoffTime: 'שעת החזרה',
      driverAge: 'גיל הנהג',
      driverAgeHint: 'נהגים מתחת לגיל 25 משלמים לרוב תוספת.',
      submit: 'חיפוש רכבים',
      datesHint: 'התאריכים הם ברירת מחדל — שנו אותם לתאריכי הטיול שלכם.',
    },
    pickupKinds: {
      airport: 'שדה תעופה',
      city: 'מרכז העיר',
      train: 'תחנת רכבת',
      other: 'מיקום אחר',
    },
    errors: {
      country: 'בחרו מדינה.',
      pickup: 'הזינו מאיפה אוספים את הרכב.',
      dropoff: 'הזינו מאיפה מחזירים את הרכב, או סמנו החזרה באותו מקום.',
      dates: 'בחרו תאריך איסוף ותאריך החזרה.',
      dateOrder: 'תאריך ההחזרה חייב להיות אחרי תאריך האיסוף.',
      age: 'הזינו גיל בין 18 ל‑99.',
    },
    results: {
      titleTemplate: 'רכבים ב{location}',
      countTemplate: '{count} הצעות',
      oneResult: 'הצעה אחת',
      daysTemplate: 'ל‑{days} ימים',
      none: 'לא נמצאו הצעות לחיפוש הזה.',
      noneHint: 'נסו עיר אחרת, תאריכים אחרים, או מקום איסוף אחר.',
      notSearched: 'מלאו את הפרטים למעלה כדי לראות הצעות.',
      total: 'סה״כ לתקופה',
      chargedTemplate: 'חברת ההשכרה גובה {amount}',
      convertedNote: 'המחירים בשקלים הם המרה משוערת. החיוב בפועל נעשה במטבע של חברת ההשכרה.',
      perDayTemplate: '{price} ליום',
      orSimilarTemplate: '{model} או דומה',
      categoryOnly: 'חברת ההשכרה מתחייבת לקטגוריה, לא לדגם מסוים.',
      seatsTemplate: '{count} מושבים',
      bagsTemplate: '{count} מזוודות',
      viewDeal: 'לפרטים',
      noLink: 'אב־טיפוס — אין עדיין קישור להזמנה',
      ratingTemplate: 'דירוג {score} מתוך {outOf}',
      ratingCountTemplate: '{count} חוות דעת',
      noRating: 'לא התקבל דירוג',
      pickupLabel: 'איסוף',
      insuranceLabel: 'ביטוח',
      fuelLabel: 'דלק',
      mileageLabel: 'קילומטראז׳',
      cancellationLabel: 'ביטול',
    },
    categories: {
      mini: 'מיני',
      economy: 'חסכונית',
      compact: 'קומפקטית',
      intermediate: 'בינונית',
      suv: 'רכב שטח',
      van: 'ואן',
      luxury: 'יוקרה',
    },
    transmission: {
      automatic: 'אוטומט',
      manual: 'ידני',
    },
    fuel: {
      'full-to-full': 'מקבלים מלא, מחזירים מלא',
      'full-to-empty': 'משלמים על מיכל מלא מראש',
      'same-to-same': 'מחזירים באותה רמת דלק',
      unknown: 'מדיניות הדלק לא נמסרה',
    },
    mileage: {
      unlimited: 'קילומטראז׳ ללא הגבלה',
      limited: 'קילומטראז׳ מוגבל',
      unknown: 'מדיניות הקילומטראז׳ לא נמסרה',
    },
    cancellation: {
      free: 'ביטול חינם',
      paid: 'ביטול בתשלום',
      none: 'ללא אפשרות ביטול',
      unknown: 'מדיניות הביטול לא נמסרה',
    },
    insurance: {
      'excess-applies': 'יש השתתפות עצמית. בדקו את הסכום מול חברת ההשכרה.',
      'basic-included': 'ביטוח בסיסי כלול. ההיקף המדויק נקבע על ידי חברת ההשכרה.',
      unknown: 'פרטי הביטוח לא נמסרו לנו. בדקו אותם לפני ההזמנה.',
    },
    demo: {
      title: 'ההצעות כאן אינן אמיתיות',
      body: 'עדיין לא חיברנו ספק השכרת רכב אמיתי. השמות והמחירים כאן נוצרו לצורך פיתוח, הם אינם הצעות של אף חברה, ואי אפשר להזמין דרכם.',
      rowLabel: 'נתוני הדגמה',
    },
  },

  /**
   * The destination index and the related-destination block.
   *
   * Both exist because 250 country pages with no links between them are 250
   * pages nobody can reach except by searching again.
   */
  destinationIndex: {
    navLabel: 'כל היעדים',
    title: 'eSIM לכל יעד',
    intro:
      'בוחרים יעד ורואים אילו חבילות eSIM מתאימות לו, כמה הן עולות ועל איזו רשת מקומית הן פועלות.',
    statusTemplate: 'יש לנו חבילות ל‑{covered} יעדים מתוך {total} שאפשר לחפש כאן.',
    demoNote: 'המחירים בעמודי היעד הם עדיין נתוני הדגמה — האתר לפני השקה.',
    popularTitle: 'היעדים המבוקשים',
    allTitle: 'כל היעדים, לפי יבשת',
    coveredLabel: 'יש חבילות',
    notCoveredLabel: 'עדיין אין',
    countTemplate: '{count} יעדים',
  },
  relatedDestinations: {
    title: 'יעדים נוספים באזור',
    body: 'אם הטיול כולל עוד עצירה, כדאי להשוות גם אותה — לפעמים חבילה אזורית אחת זולה משתי חבילות מדינה.',
  },

  /**
   * Privacy and terms.
   *
   * Written from what the code does, not from a template. Every claim below
   * is checkable in the repository, and the storage table is generated from
   * the constants the software actually uses.
   */
  privacyPage: {
    navLabel: 'פרטיות',
    title: 'מדיניות פרטיות',
    intro:
      'האתר הזה לא מבקש מכם דבר. אין הרשמה, אין טפסים, אין תשלומים, ואין לנו שום דרך לדעת מי אתם. מה שכן נשמר במכשיר שלכם מפורט כאן במלואו.',
    reviewedTemplate: 'הנוסח נבדק מול הקוד בתאריך {date}.',
    operator: {
      heading: 'מי מפעיל את האתר',
      body: [
        'האתר מופעל על ידי יחיד ולא על ידי חברה. אין מאחוריו גוף מסחרי רשום.',
        'לכל פנייה בנושא פרטיות — ובכלל זה בקשה למחוק מידע או לברר מה נשמר — אפשר לכתוב לכתובת שבתחתית העמוד.',
      ],
    },
    notCollected: {
      heading: 'מה אנחנו לא עושים',
      intro: 'הדברים הבאים אינם קיימים באתר, ואפשר לבדוק את זה בקוד:',
      items: [
        'אין חשבונות משתמש ואין הרשמה.',
        'אין טופס אחד שאוסף פרטים אישיים.',
        'אין תשלומים ואין כרטיסי אשראי. הרכישה מתבצעת תמיד באתר של הספק.',
        'אין כלי אנליטיקס. המודול שמרכז אירועים באתר לא שולח אותם לשום מקום.',
        'אין רשתות פרסום, אין פיקסלים ואין בניית פרופילים.',
      ],
    },
    storage: {
      heading: 'מה נשמר במכשיר שלכם',
      intro:
        'ארבעה פריטים, כולם נשמרים בדפדפן שלכם בלבד ואף אחד מהם לא נשלח אלינו או לצד שלישי:',
      keyLabel: 'שם',
      kindLabel: 'סוג',
      purposeLabel: 'למה',
      kinds: {
        cookie: 'עוגייה',
        local: 'אחסון מקומי',
        session: 'אחסון לשונית',
      },
      purposes: {
        currency: 'המטבע שבחרתם להצגת מחירים, כדי שלא תצטרכו לבחור בכל ביקור.',
        preview: 'סיסמת תצוגה מוקדמת, ורק כאשר השער סגור. כרגע הוא פתוח והעוגייה הזו אינה נכתבת.',
        recentDestinations: 'קודי המדינות שחיפשתם לאחרונה, כדי להציע אותן בשורת החיפוש. קודי מדינה בלבד.',
        tripExtras: 'העובדה שסגרתם את הצעת השכרת הרכב, כדי לא להציע אותה שוב באותה לשונית.',
      },
      conditionalNote: 'נכתב רק כשהתכונה הזו מופעלת.',
      clearing:
        'כל הפריטים האלה נמחקים כשמנקים את נתוני האתר בדפדפן. אחסון הלשונית נמחק גם כשסוגרים את הלשונית.',
    },
    logs: {
      heading: 'יומני שרת',
      body: [
        'האתר מתארח בשירות Vercel, ושירותי אירוח שומרים יומני בקשות טכניים — ובהם כתובת IP, סוג הדפדפן והעמוד שנטען. זה קורה בכל אתר באינטרנט.',
        'אנחנו לא ניגשים ליומנים האלה כדי לזהות מישהו, לא מצליבים אותם עם שום דבר ולא בונים מהם פרופילים. הם קיימים לצורך תפעול ואבטחה של השרת.',
      ],
    },
    outbound: {
      heading: 'קישורים לספקים',
      body: [
        'כשאתם לוחצים על כפתור שמוביל לספק, אתם עוזבים את האתר שלנו. מאותו רגע חלה מדיניות הפרטיות של הספק, לא שלנו.',
        'הקישור נושא מזהה שותף שמספר לספק שהקליק הגיע מאיתנו. הוא לא מספר עליכם דבר — לא שם, לא אימייל ולא מה חיפשתם.',
        'הספק עשוי לכתוב עוגיות משלו באתר שלו. אין לנו שליטה עליהן ואין לנו גישה אליהן.',
      ],
    },
    rights: {
      heading: 'הזכויות שלכם',
      body: [
        'מאחר שאיננו מחזיקים מידע שמזהה אתכם, אין לנו מאגר שאפשר לבקש ממנו עיון, תיקון או מחיקה.',
        'מה שנשמר נמצא בדפדפן שלכם ובשליטתכם המלאה — ניקוי נתוני האתר מוחק את הכול.',
        'אם בכל זאת יש לכם שאלה או חשש בנושא פרטיות, אתם מוזמנים לכתוב לנו והתשובה תהיה כנה.',
      ],
    },
    changes: {
      heading: 'שינויים',
      body: [
        'אם תוכן העמוד הזה ישתנה, התאריך שלמעלה ישתנה איתו. העמוד נבדק מול הקוד ולא נכתב פעם אחת ונשכח.',
      ],
    },
    contactHeading: 'יצירת קשר',
  },
  termsPage: {
    navLabel: 'תנאי שימוש',
    title: 'תנאי שימוש',
    intro:
      'יש קליטה? הוא אתר השוואה ומידע. אנחנו לא מוכרים חבילות eSIM, לא מנפיקים אותן ולא צד להתקשרות ביניכם לבין הספק.',
    updatedTemplate: 'עודכן לאחרונה בתאריך {date}.',
    sections: [
      {
        heading: 'מה האתר הזה',
        body: [
          'אנחנו מרכזים חבילות eSIM של ספקים שונים, מדרגים אותן לפי פרטי הטיול שמסרתם, ומפנים אתכם לאתר של הספק.',
          'הרכישה, התשלום, ההפעלה, התמיכה והביטולים — כל אלה מתבצעים מול הספק בלבד. איננו צד לעסקה.',
        ],
      },
      {
        heading: 'על המחירים והנתונים',
        body: [
          'המחירים והנתונים באתר נלקחים ממקורות של הספקים ומוצגים עם התאריך שבו נבדקו. הם עלולים להשתנות, ומבצעים מסתיימים.',
          'המחיר המחייב הוא זה שמופיע באתר הספק ברגע הרכישה. תמיד כדאי לבדוק אותו שם לפני שמשלמים.',
          'אנחנו לא ממציאים מחירים, דירוגים או יכולות. נתון שלא הצלחנו לאמת מסומן ככזה או שאינו מוצג כלל.',
        ],
      },
      {
        heading: 'זו לא המלצה אישית',
        body: [
          'הדירוג באתר מחושב מנתוני החבילה ומפרטי הטיול שמסרתם. הוא לא מביא בחשבון את המכשיר שלכם, את חברת הסלולר שלכם או נסיבות אישיות אחרות.',
          'ההחלטה מה לקנות היא שלכם. אנחנו נותנים כלי להשוואה, לא ייעוץ.',
        ],
      },
      {
        heading: 'הקשר המסחרי שלנו',
        body: [
          'חלק מהקישורים לספקים הם קישורי שותפים, וייתכן שנקבל עמלה על רכישה שבוצעה דרכם — בלי שתשלמו שקל נוסף.',
          'העמלה אינה משפיעה על הדירוג. ההסבר המלא נמצא בעמוד גילוי נאות.',
        ],
      },
      {
        heading: 'אתרים של צד שלישי',
        body: [
          'קישור לאתר של ספק אינו המלצה על התנאים שלו, על מדיניות הפרטיות שלו או על השירות שיקבלו ממנו.',
          'איננו אחראים לתוכן באתרים חיצוניים, להתחייבויות שניתנות בהם או לחוזה שייכרת ביניכם לבינם.',
        ],
      },
      {
        heading: 'זמינות ואחריות',
        body: [
          'האתר מסופק כמות שהוא. איננו מתחייבים שהוא יהיה זמין ברציפות, נקי מתקלות או מדויק בכל רגע נתון.',
          'במידה המותרת בדין, איננו אחראים לנזק עקיף שנגרם משימוש באתר או מהסתמכות על מידע שבו. אם מצאתם טעות, כתבו לנו ונתקן.',
        ],
      },
      {
        heading: 'הדין החל',
        body: ['על תנאים אלה חלים דיני מדינת ישראל.'],
      },
    ],
    contactHeading: 'יצירת קשר',
    contactBody: 'לשאלות על התנאים האלה או לדיווח על טעות באתר:',
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
