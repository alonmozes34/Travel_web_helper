import type { Locale } from './config';

/**
 * What the loading screen says, in both languages.
 *
 * Kept apart from the dictionaries on purpose. The loading screen is shown
 * before the page, in the browser, and receives no props — importing the
 * dictionaries there would ship all of both of them to every visitor to say
 * one sentence.
 */
export const loadingCopy: Record<
  Locale,
  { title: string; titleToTemplate: string; body: string; from: string; anywhere: string }
> = {
  he: {
    title: 'מחפשים את החבילות המתאימות…',
    titleToTemplate: 'מחפשים חבילות ל{to}…',
    body: 'טוענים מחירים עדכניים מהספקים. זה לוקח כמה שניות.',
    from: '🇮🇱 תל אביב',
    anywhere: 'היעד שלך',
  },
  en: {
    title: 'Finding the plans that fit…',
    titleToTemplate: 'Finding plans for {to}…',
    body: 'Loading current prices from the providers. This takes a few seconds.',
    from: '🇮🇱 Tel Aviv',
    anywhere: 'Your destination',
  },
};
