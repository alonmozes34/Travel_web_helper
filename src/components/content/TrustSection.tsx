import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * What the tool actually does for the traveller. Every claim here is one the
 * product can back up — there is deliberately no "always the cheapest".
 */
export function TrustSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-14">
      <Container>
        <h2 className="font-head text-2xl font-semibold">{dict.trust.title}</h2>
        <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {dict.trust.items.map((item) => (
            <li key={item.title} className="border-t-2 border-teal pt-3.5">
              <h3 className="font-head font-semibold">{item.title}</h3>
              <p className="mt-1 text-base text-ink-2">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
