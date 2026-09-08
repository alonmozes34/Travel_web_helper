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
  units: {
    perGb: 'ל‑GB',
    perDay: 'ליום',
    days: 'ימים',
    day: 'יום',
    unlimited: 'ללא הגבלה',
  },
};

export type Dictionary = typeof he;
