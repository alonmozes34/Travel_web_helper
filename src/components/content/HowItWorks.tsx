import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/i18n/getDictionary';

/** Three real steps in order, so the numbering carries information. */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-surface py-16 md:py-20">
      <Container>
        <h2 className="font-head text-3xl font-bold md:text-4xl">{dict.howItWorks.title}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {dict.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="min-w-0 rounded-[20px] border border-line-soft bg-canvas p-6">
              <span
                aria-hidden="true"
                className="tnum flex size-12 items-center justify-center rounded-2xl bg-brand font-head text-xl font-bold text-on-brand shadow-search"
              >
                {index + 1}
              </span>
              <h3 className="mt-5 font-head text-xl font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-base text-ink-2">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
