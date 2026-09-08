import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/i18n/getDictionary';

/** Three real steps in order, so the numbering carries information. */
export function HowItWorks({ dict }: { dict: Dictionary }) {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-t border-line-soft bg-surface py-14">
      <Container>
        <h2 className="font-head text-2xl font-semibold">{dict.howItWorks.title}</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-10">
          {dict.howItWorks.steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="tnum flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 font-head text-[0.8125rem] font-semibold text-brand"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-head text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-[0.9375rem] text-ink-2">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
