import { getCountryByCode } from '@/data/countries';
import type { ContinentId } from '@/data/countryTypes';
import { getProvider } from '@/data/providers';
import { getDictionary } from '@/i18n/getDictionary';
import { TOPIC_LABELS } from '@/lib/contact/contact';
import type { BookingStep } from './events';

/** Hebrew names for the counters' keys — the dashboard and the weekly email are the owner's, in Hebrew. */

export const sourceLabels: Record<string, string> = {
  direct: 'ישירות (בלי אתר מפנה)',
  internal: 'מתוך האתר',
  google: 'Google',
  bing: 'Bing',
  facebook: 'Facebook',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  x: 'X (Twitter)',
  chatgpt: 'ChatGPT',
  'other-site': 'אתר אחר',
};

export const deviceLabels: Record<string, string> = { phone: 'טלפון', tablet: 'טאבלט', desktop: 'מחשב' };

export const languageLabels: Record<string, string> = { he: 'עברית', en: 'אנגלית' };

export const pageLabels: Record<string, string> = {
  '/': 'דף הבית',
  '/search': 'תוצאות חיפוש',
  '/esim': 'כל היעדים',
  '/esim/[country]': 'עמוד של מדינה',
  '/devices': 'מכשירים תומכים',
  '/guides': 'מדריכים',
  '/guides/[guide]': 'מדריך',
  '/about': 'אודות',
  '/accessibility': 'הצהרת נגישות',
  '/privacy': 'פרטיות',
  '/terms': 'תנאי שימוש',
  '/disclosure': 'גילוי נאות',
  '/contact': 'צור קשר',
  '/unlock': 'כניסה בסיסמה',
  '/car-rental': 'השכרת רכב',
  '/codes': 'קודי הנחה',
  '/reviews': 'ביקורות',
  '404': 'עמוד שלא קיים (404)',
  other: 'אחר',
};

export const continentLabels: Record<ContinentId, string> = {
  europe: 'אירופה',
  'middle-east': 'המזרח התיכון',
  asia: 'אסיה',
  africa: 'אפריקה',
  'north-america': 'צפון אמריקה',
  caribbean: 'האיים הקריביים',
  'south-america': 'דרום אמריקה',
  oceania: 'אוקיאניה',
  antarctic: 'אנטארקטיקה',
};

export const daysLabels: Record<string, string> = {
  '1-3': 'עד 3 ימים',
  '4-7': '4–7 ימים',
  '8-14': '8–14 ימים',
  '15-30': '15–30 ימים',
  '31+': 'יותר מ־30 ימים',
  unstated: 'לא צוין',
};

export const stopsLabels: Record<string, string> = { '1': 'יעד אחד', '2': 'שני יעדים', '3+': 'שלושה ויותר' };

export const positionLabels: Record<string, string> = {
  '1': 'ראשונה ברשימה',
  '2': 'שנייה',
  '3': 'שלישית',
  '4-10': 'רביעית עד עשירית',
  '11+': 'אחרי העשירית',
  combination: 'חלק משילוב של שתי חבילות',
};

export const bookingStepLabels: Record<BookingStep, string> = {
  reminder: 'הוצגה התזכורת בלחיצה על חבילה',
  continued: 'המשיכו מהתזכורת לחבילה',
  card: 'הודגש החלק של Booking בחזרה מהחבילה',
  pick: 'סימנו יעד בחלק של Booking',
  hotels: 'לחצו "מלונות" בכרטיס',
  cars: 'לחצו "רכב" בכרטיס',
  attractions: 'לחצו "אטרקציות" בכרטיס',
  decline: 'לחצו "לא תודה"',
  'page-hotels': 'לחצו "מלונות" בעמוד של מדינה',
  'page-cars': 'לחצו "רכב" בעמוד של מדינה',
  'page-attractions': 'לחצו "אטרקציות" בעמוד של מדינה',
};

export const contactLabels: Record<string, string> = TOPIC_LABELS;

const usages = getDictionary('he').personalization.usages as Record<string, string>;
export const usageLabel = (key: string) =>
  key === 'stated-gb'
    ? 'כתבו כמות GB בעצמם'
    : key === 'calculator'
      ? 'סימנו במחשבון'
      : key === 'unstated'
        ? 'לא צוין'
        : (usages[key] ?? key);

const activities = getDictionary('he').personalization.activities as Record<string, string>;
export const activityLabel = (key: string) => activities[key] ?? key;

export const countryLabel = (code: string) => {
  if (code === 'unknown') return 'לא ידוע';
  const country = getCountryByCode(code);
  return country ? `${country.flag} ${country.names.he}` : code;
};

/** A multi-stop trip, `FR+IT`. */
export const tripLabel = (codes: string) => codes.split('+').map(countryLabel).join(' + ');

export const providerLabel = (id: string) => getProvider(id)?.name ?? id;

/** `2026-10-13` → `13.10`. */
export const shortDay = (day: string) => `${Number(day.slice(8, 10))}.${Number(day.slice(5, 7))}`;
