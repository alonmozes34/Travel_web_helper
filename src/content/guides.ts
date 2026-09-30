import type { Locale } from '@/i18n/config';

/**
 * Short, general guides — what a first-time eSIM buyer needs before the
 * comparison makes sense. Added on 30 September 2026, after two affiliate
 * programmes declined the site for the "quality" of its content: the country
 * pages answered questions about their own plans, and nothing answered the
 * questions people have before they get there.
 *
 * Only what holds for eSIMs in general. Nothing here names a provider or
 * states a price; where things differ between providers or phones — when a
 * plan starts counting days, what a menu is called — the text says so and
 * sends the reader to the provider's own terms. The data guide's figures are
 * not written here at all: they are read from `dailyDataMbByUsage`, the same
 * numbers the search uses.
 */
export type GuideSection = { heading: string; body: string[] };

export type Guide = {
  slug: 'choose' | 'how-much-data' | 'install';
  title: string;
  description: string;
  sections: GuideSection[];
  /** Where the data table goes, for the data guide: after this many sections. */
  dataTableAfter?: number;
};

const he: Guide[] = [
  {
    slug: 'choose',
    title: 'איך בוחרים חבילת eSIM לחו״ל',
    description: 'חמישה דברים שכדאי לבדוק לפני שקונים: ימים, נפח, ״ללא הגבלה״, רשת מקומית ומחיר.',
    sections: [
      {
        heading: 'קודם כול: הטלפון תומך?',
        body: [
          'רוב הטלפונים מהשנים האחרונות תומכים ב־eSIM, אבל לא כולם. גם טלפון שנקנה נעול לחברה מסוימת עלול לא לקבל eSIM של חברה אחרת. אפשר לבדוק את הדגם שלכם בדף תאימות המכשירים.',
        ],
      },
      {
        heading: 'ימים: החבילה צריכה להחזיק את כל הטיול',
        body: [
          'חבילה של 7 ימים לטיול של 10 ימים תיגמר באמצע. רוב הספקים מתחילים לספור את הימים מהרגע שהחבילה מתחברת לרשת ביעד, אבל יש כאלה שסופרים מההתקנה — כדאי לבדוק בתנאים של הספק לפני שמתקינים מוקדם.',
        ],
      },
      {
        heading: 'נפח: עדיף קצת יותר מקצת פחות',
        body: [
          'חבילה שנגמרת באמצע היום מבאסת יותר מכמה GB שנשארו. אם אתם לא בטוחים כמה אתם צורכים, יש לנו מדריך קצר עם הערכה לפי סוג השימוש.',
          'אצל חלק מהספקים אפשר להוסיף גלישה באמצע הטיול, אבל זה לא תמיד זול יותר מלקנות מראש חבילה גדולה יותר.',
        ],
      },
      {
        heading: '״ללא הגבלה״ — בדרך כלל עם כוכבית',
        body: [
          'ברוב החבילות ״ללא הגבלה״ המהירות יורדת אחרי כמות מסוימת של גלישה — ליום או לכל התקופה. השאלה היא אחרי כמה, ולאיזו מהירות: 1Mbps מספיק למפות ולהודעות, מהירות נמוכה ממנה בקושי טוענת עמוד.',
          'כשהספק מציין את התנאים, אנחנו מראים אותם בכרטיס. כשהוא לא מציין, כתוב ״לא צוין״.',
        ],
      },
      {
        heading: 'רשת מקומית ו־5G',
        body: [
          'חבילת eSIM עובדת על הרשתות של החברות המקומיות ביעד. כשחבילה יכולה להתחבר ליותר מרשת אחת, יש יותר סיכוי לקליטה טובה גם מחוץ לערים. 5G עוזר רק אם גם הטלפון תומך בו.',
        ],
      },
      {
        heading: 'מחיר: של כל הטיול, לא לכל GB',
        body: [
          'חבילה עם מחיר נמוך ל־GB שמגיעה עם הרבה יותר גלישה ממה שצריך היא לא בהכרח משתלמת. אנחנו מראים את המחיר של החבילה כולה, בשקלים.',
          'הספק גובה במטבע שלו, בדרך כלל בדולרים או ביורו, ולכן חברת האשראי עשויה להוסיף עמלת המרה. קודי הנחה הם בדרך כלל לרכישה הראשונה בלבד.',
        ],
      },
    ],
  },
  {
    slug: 'how-much-data',
    title: 'כמה גלישה צריך לטיול?',
    description: 'הערכה לפי סוג השימוש, ליום ולשבוע, ואיך לחסוך בגלישה בלי לוותר על כלום.',
    sections: [
      {
        heading: 'ההערכה שלנו',
        body: [
          'אלה המספרים שהחיפוש באתר משתמש בהם. הם הערכה שמרנית, לא מדידה: עדיף להמליץ על קצת יותר מאשר על חבילה שתיגמר. אם אתם יודעים כמה אתם צורכים, אפשר להזין כמות GB בחיפוש במקום לבחור סוג שימוש.',
        ],
      },
      {
        heading: 'איך לחסוך בגלישה',
        body: [
          'להוריד לפני הטיסה מפות לשימוש בלי אינטרנט, וגם פלייליסטים ופרקים לצפייה.',
          'לכבות גיבוי אוטומטי של תמונות ועדכוני אפליקציות על גלישה סלולרית, ולהשאיר אותם ל־Wi-Fi במלון.',
          'וידאו הוא מה שהכי אוכל גלישה. שיחת וידאו או צפייה בסרטונים לשעה יכולות לצרוך יותר מיום שלם של מפות והודעות.',
        ],
      },
    ],
    dataTableAfter: 1,
  },
  {
    slug: 'install',
    title: 'איך מתקינים eSIM ומה עושים בנחיתה',
    description: 'מתקינים בבית על Wi-Fi, מפעילים בנחיתה, ושלוש הגדרות שחוסכות הפתעות בחשבון.',
    sections: [
      {
        heading: 'לפני הטיסה: מתקינים בבית',
        body: [
          'אחרי הרכישה הספק שולח קוד QR או קישור, או שההתקנה נעשית באפליקציה שלו. הכי נוח להתקין בבית, על Wi-Fi, יום או יומיים לפני הטיסה. בדקו בתנאים של הספק מתי החבילה מתחילה לספור ימים.',
          'באייפון: הגדרות ← סלולרי ← הוספת eSIM, ושם סורקים את הקוד. באנדרואיד: הגדרות ← רשתות (או חיבורים) ← כרטיסי SIM ← הוספת eSIM. שמות התפריטים משתנים לפי הדגם והגרסה — ההוראות של הספק קובעות.',
        ],
      },
      {
        heading: 'שלוש הגדרות שחוסכות הפתעות',
        body: [
          'נותנים לקו החדש שם ברור, למשל ״חו״ל״, ומגדירים אותו כקו לגלישה סלולרית.',
          'בקו של ה־eSIM מפעילים נדידת נתונים — רוב חבילות התיירים עובדות רק כך.',
          'בקו הישראלי מכבים נדידת נתונים, כדי שהחברה בארץ לא תחייב על גלישה בחו״ל. אפשר להשאיר אותו פעיל לשיחות ולהודעות, למשל לקודי אימות מהבנק.',
        ],
      },
      {
        heading: 'בנחיתה',
        body: [
          'מבטלים מצב טיסה ומחכים דקה־שתיים שהטלפון יתחבר לרשת מקומית. אם אין חיבור: מפעילים מחדש את הטלפון, מוודאים שהגלישה עוברת בקו של ה־eSIM ושנדידת הנתונים בו פועלת, ואם צריך בוחרים רשת ידנית.',
          'אם עדיין אין חיבור, התמיכה של הספק היא הכתובת — הם רואים את מצב החבילה שלכם.',
        ],
      },
      {
        heading: 'אל תמחקו את ה־eSIM באמצע הטיול',
        body: [
          'אצל רוב הספקים אי אפשר להתקין שוב eSIM שנמחק. מוחקים רק כשהחבילה נגמרה והטיול מאחוריכם.',
        ],
      },
    ],
  },
];

const en: Guide[] = [
  {
    slug: 'choose',
    title: 'How to choose a travel eSIM',
    description: 'Five things to check before you buy: days, data, "unlimited", the local network and the price.',
    sections: [
      {
        heading: 'First: does your phone support it?',
        body: [
          'Most phones from recent years support eSIM, but not all. A phone bought locked to one carrier may also refuse another company\'s eSIM. You can check your model on the device compatibility page.',
        ],
      },
      {
        heading: 'Days: the plan has to last the whole trip',
        body: [
          'A 7-day plan for a 10-day trip runs out half-way. Most providers start counting days when the plan first connects at your destination, but some count from installation — check the provider\'s terms before installing early.',
        ],
      },
      {
        heading: 'Data: a little more beats a little less',
        body: [
          'A plan that runs out mid-day is worse than a few gigabytes left over. If you are not sure how much you use, our short guide estimates it by type of use.',
          'Some providers let you add data during the trip, but that is not always cheaper than buying a bigger plan up front.',
        ],
      },
      {
        heading: '"Unlimited" usually comes with a footnote',
        body: [
          'On most "unlimited" plans the speed drops after a certain amount of data — per day or for the whole period. What matters is after how much, and to what speed: 1Mbps is enough for maps and messages; much less barely loads a page.',
          'When the provider states the terms, the card shows them. When it does not, the card says "not stated".',
        ],
      },
      {
        heading: 'Local network and 5G',
        body: [
          'A travel eSIM runs on the local carriers\' networks at your destination. A plan that can use more than one network has a better chance of good reception outside the cities. 5G only helps if your phone supports it too.',
        ],
      },
      {
        heading: 'Price: for the whole trip, not per GB',
        body: [
          'A low price per GB on far more data than you need is not necessarily a good deal. We show the price of the whole plan.',
          'Providers charge in their own currency, usually dollars or euros, so your card company may add a conversion fee. Discount codes are usually for a first purchase only.',
        ],
      },
    ],
  },
  {
    slug: 'how-much-data',
    title: 'How much data do you need for a trip?',
    description: 'An estimate by type of use, per day and per week, and how to use less without missing anything.',
    sections: [
      {
        heading: 'Our estimate',
        body: [
          'These are the figures the site\'s search uses. They are a cautious estimate, not a measurement: better to suggest a little too much than a plan that runs out. If you know your own usage, you can enter a GB amount in the search instead of choosing a type of use.',
        ],
      },
      {
        heading: 'How to use less data',
        body: [
          'Before you fly, download maps for offline use, and playlists or episodes to watch.',
          'Turn off automatic photo backup and app updates over mobile data, and leave them for the hotel Wi-Fi.',
          'Video uses the most. An hour of video calls or streaming can use more than a whole day of maps and messages.',
        ],
      },
    ],
    dataTableAfter: 1,
  },
  {
    slug: 'install',
    title: 'How to install an eSIM, and what to do when you land',
    description: 'Install at home on Wi-Fi, switch on when you land, and three settings that prevent surprises on your bill.',
    sections: [
      {
        heading: 'Before the flight: install at home',
        body: [
          'After you buy, the provider sends a QR code or a link, or installs through its app. It is easiest to install at home on Wi-Fi, a day or two before the flight. Check the provider\'s terms for when the plan starts counting days.',
          'On iPhone: Settings → Cellular (Mobile Data) → Add eSIM, then scan the code. On Android: Settings → Network (or Connections) → SIMs → Add eSIM. Menu names vary by model and version — the provider\'s instructions come first.',
        ],
      },
      {
        heading: 'Three settings that prevent surprises',
        body: [
          'Give the new line a clear name, such as "Abroad", and set it as the line for mobile data.',
          'On the eSIM line, turn data roaming on — most travel plans only work that way.',
          'On your home line, turn data roaming off, so your carrier at home does not charge for data abroad. You can keep it on for calls and messages, such as verification codes from your bank.',
        ],
      },
      {
        heading: 'When you land',
        body: [
          'Turn off airplane mode and give the phone a minute or two to join a local network. If it does not connect: restart the phone, check that mobile data uses the eSIM line and that data roaming is on for it, and choose a network manually if needed.',
          'If it still does not connect, the provider\'s support is the place to go — they can see the state of your plan.',
        ],
      },
      {
        heading: 'Do not delete the eSIM mid-trip',
        body: [
          'With most providers, a deleted eSIM cannot be installed again. Delete it only once the plan is used up and the trip is over.',
        ],
      },
    ],
  },
];

export const guides: Record<Locale, Guide[]> = { he, en };

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return guides[locale].find((guide) => guide.slug === slug);
}
