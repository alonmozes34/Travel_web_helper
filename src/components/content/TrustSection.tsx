import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * What the tool actually does for the traveller. Every claim here is one the
 * product can back up — there is deliberately no "always the cheapest".
 */
export function TrustSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="on-night bg-night-band py-16 text-on-night md:py-20">
      <Container>
        <h2 className="font-head text-3xl font-bold text-on-night md:text-4xl">{dict.trust.title}</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.trust.items.map((item) => (
            <li key={item.title} className="min-w-0 rounded-[20px] border border-white/10 bg-white/5 p-6">
              <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-teal" />
              <h3 className="mt-4 font-head text-lg font-semibold text-on-night">{item.title}</h3>
              <p className="mt-1.5 text-base text-on-night-2">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
