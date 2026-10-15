import { Container } from '@/components/ui/Container';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * "Does my phone take an eSIM?" on the home page (the owner, 15 October 2026).
 * A plain form: the answer is the devices page, filtered to the model typed,
 * so there is one list of devices, checked against the manufacturers' own
 * pages, and nothing here to keep in step with it. Works without script.
 */
export function PhoneCheck({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const copy = dict.home.phoneCheck;
  return (
    <section aria-labelledby="phone-check-title" className="bg-surface-2 py-10">
      <Container>
        <div className="max-w-[720px]">
          <h2 id="phone-check-title" className="font-head text-2xl font-semibold">
            {copy.title}
          </h2>
          <p className="mt-2 text-ink-2">{copy.body}</p>
          <form action={`${localePath(locale, '/devices')}#device-list`} method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 basis-56">
              <label htmlFor="phone-check-model" className="block text-sm font-semibold text-ink-2">
                {copy.label}
              </label>
              <input
                id="phone-check-model"
                name="q"
                type="search"
                autoComplete="off"
                placeholder={copy.placeholder}
                className="mt-2 h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-ink focus-visible:border-brand"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center rounded-md bg-brand px-6 font-semibold text-on-brand hover:bg-brand-hover"
            >
              {copy.submit}
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
