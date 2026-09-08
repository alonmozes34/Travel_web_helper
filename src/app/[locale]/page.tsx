import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Ltr } from '@/components/ui/Bdi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip, ChipLink } from '@/components/ui/Chip';
import { Checkbox } from '@/components/ui/Checkbox';
import { Disclosure } from '@/components/ui/Disclosure';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { MockDataNotice } from '@/components/content/MockDataNotice';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { formatPrice } from '@/lib/formatters/price';
import { formatData } from '@/lib/formatters/data';
import { formatDuration } from '@/lib/formatters/duration';
import { SheetDemo } from './_components/SheetDemo';

/**
 * TEMPORARY — Phase 1 foundations page.
 *
 * This route is replaced by the real homepage in Phase 2. Its copy lives here
 * rather than in the dictionary because all of it is deleted with the page.
 */
const copy = {
  eyebrow: 'שלב 1 — יסודות',
  title: 'מערכת העיצוב מוכנה',
  lede: 'Header, Footer, טוקנים, פונטים, RTL, רכיבי בסיס ופורמטרים. עמוד זה זמני ויוחלף בדף הבית בשלב 2.',
  palette: 'פלטה',
  typography: 'טיפוגרפיה',
  components: 'רכיבי בסיס',
  formatters: 'פורמטרים',
  disclosureTitle: 'שקיפות שותפים',
  swatches: [
    { name: 'Primary — פעולה', varName: '--color-brand', hex: '#0B6BD3' },
    { name: 'Turquoise — ערך', varName: '--color-teal', hex: '#16BFB6' },
    { name: 'Turquoise — טקסט', varName: '--color-teal-ink', hex: '#0A7E78' },
    { name: 'Ink — טקסט', varName: '--color-ink', hex: '#14232F' },
    { name: 'Ink 2 — משני', varName: '--color-ink-2', hex: '#5A6D7E' },
    { name: 'Canvas — רקע', varName: '--color-canvas', hex: '#F6F9FB' },
    { name: 'Line — הפרדה', varName: '--color-line', hex: '#E2EAF0' },
    { name: 'Caution — FUP', varName: '--color-warn-ink', hex: '#9A5A00' },
  ],
  typeSamples: [
    { label: 'Display · Rubik 700', text: 'eSIM לתאילנד', className: 'font-head text-4xl font-bold tracking-tight' },
    { label: 'Heading · Rubik 600', text: '42 חבילות מ־8 ספקים', className: 'font-head text-2xl font-semibold' },
    {
      label: 'Body · Assistant',
      text: 'משווים חבילות eSIM ממגוון ספקים במקום אחד — לפי מחיר, נפח גלישה, תוקף ורשת מקומית.',
      className: 'text-base text-ink-2',
    },
  ],
  buttons: { primary: 'צפייה בחבילה', secondary: 'פרטים', quiet: 'התאם לי חבילה לטיול' },
  chips: { greece: '🇬🇷 יוון', thailand: '🇹🇭 תאילנד', japan: '🇯🇵 יפן' },
  badges: { best: '🏆 הכי משתלם', tech: '5G', fup: 'מדיניות שימוש הוגן' },
  checkbox: { hotspot: 'Hotspot', calls: 'שיחות' },
  sheet: {
    trigger: 'פתיחת גיליון סינון',
    title: 'סינון ומיון',
    apply: 'הצג תוצאות',
    options: ['10GB', '20GB', 'Unlimited'],
  },
  faqSample: {
    question: 'מה זה eSIM?',
    answer:
      'eSIM הוא כרטיס SIM דיגיטלי המובנה במכשיר. במקום להחליף כרטיס פיזי, סורקים קוד QR או מתקינים דרך אפליקציה, והקו נוסף למכשיר לצד ה־SIM הישראלי.',
  },
  formatterRows: [
    'מחיר שלם',
    'מחיר עם אגורות',
    'נפח גלישה',
    'נפח קטן',
    'תוקף',
  ],
};

export default async function FoundationsPage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const formatterExamples = [
    { label: copy.formatterRows[0], value: formatPrice(5900, 'ILS', locale) },
    { label: copy.formatterRows[1], value: formatPrice(295, 'ILS', locale) },
    { label: copy.formatterRows[2], value: formatData(20480, locale) },
    { label: copy.formatterRows[3], value: formatData(500, locale) },
    { label: copy.formatterRows[4], value: formatDuration(30, locale, dict) },
  ];

  return (
    <Container className="py-12">
      <p className="text-[0.8125rem] font-semibold tracking-[0.13em] text-ink-3 uppercase">
        {copy.eyebrow}
      </p>
      <h1 className="mt-2 text-4xl font-bold">{copy.title}</h1>
      <p className="mt-3 max-w-[62ch] text-lg text-ink-2">{copy.lede}</p>

      <MockDataNotice dict={dict} className="mt-8 max-w-[80ch]" />

      {/* Palette */}
      <section className="mt-14">
        <h2 className="font-head text-xl font-semibold">{copy.palette}</h2>
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {copy.swatches.map((swatch) => (
            <li key={swatch.varName} className="overflow-hidden rounded-sm border border-line bg-surface">
              <div className="h-13" style={{ backgroundColor: `var(${swatch.varName})` }} />
              <div className="px-2.5 py-2">
                <p className="text-[0.8125rem] font-semibold">{swatch.name}</p>
                <Ltr className="block font-mono text-[0.7rem] text-ink-2">{swatch.hex}</Ltr>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Typography */}
      <section className="mt-14">
        <h2 className="font-head text-xl font-semibold">{copy.typography}</h2>
        <div className="mt-4 rounded-lg border border-line bg-surface px-5">
          {copy.typeSamples.map((sample) => (
            <div key={sample.label} className="border-b border-line-soft py-4 last:border-b-0">
              <p className="text-xs font-semibold tracking-[0.09em] text-ink-3 uppercase">
                {sample.label}
              </p>
              <p className={`mt-1.5 ${sample.className}`}>{sample.text}</p>
            </div>
          ))}
          <div className="border-t border-line-soft py-4">
            <p className="text-xs font-semibold tracking-[0.09em] text-ink-3 uppercase">
              Numbers · tabular
            </p>
            <p className="tnum mt-1.5 font-head text-2xl font-bold tracking-tight">
              <Ltr>₪59</Ltr> · <Ltr>20GB</Ltr> · 30 ימים
            </p>
          </div>
        </div>
      </section>

      {/* Components */}
      <section className="mt-14">
        <h2 className="font-head text-xl font-semibold">{copy.components}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button>{copy.buttons.primary}</Button>
              <Button variant="secondary">{copy.buttons.secondary}</Button>
              <Button variant="quiet" size="sm">
                {copy.buttons.quiet}
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <ChipLink href="#0">{copy.chips.greece}</ChipLink>
              <Chip selected>{copy.chips.thailand}</Chip>
              <Chip>{copy.chips.japan}</Chip>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="value">{copy.badges.best}</Badge>
              <Badge tone="brand">{copy.badges.tech}</Badge>
              <Badge tone="warn">{copy.badges.fup}</Badge>
              <Badge>{dict.units.unlimited}</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex flex-col">
              <Checkbox label={copy.checkbox.hotspot} defaultChecked />
              <Checkbox label={copy.checkbox.calls} />
            </div>
            <div className="mt-4">
              <SheetDemo
                trigger={copy.sheet.trigger}
                title={copy.sheet.title}
                closeLabel={dict.common.close}
                applyLabel={copy.sheet.apply}
                options={copy.sheet.options}
              />
            </div>
            <div className="mt-5">
              <Disclosure summary={copy.faqSample.question}>{copy.faqSample.answer}</Disclosure>
            </div>
          </div>
        </div>
      </section>

      {/* Formatters */}
      <section className="mt-14">
        <h2 className="font-head text-xl font-semibold">{copy.formatters}</h2>
        <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-lg border border-line bg-surface p-5 sm:grid-cols-2">
          {formatterExamples.map((example) => (
            <div key={example.label} className="flex items-baseline justify-between gap-4 border-b border-line-soft py-2">
              <dt className="text-[0.8125rem] text-ink-2">{example.label}</dt>
              <dd className="tnum font-head font-semibold">
                <Ltr>{example.value}</Ltr>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Disclosure */}
      <section className="mt-14">
        <h2 className="font-head text-xl font-semibold">{copy.disclosureTitle}</h2>
        <div className="mt-4 rounded-lg border border-line bg-surface p-5">
          <AffiliateDisclosure dict={dict} />
        </div>
      </section>
    </Container>
  );
}
