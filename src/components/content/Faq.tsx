import { Container } from '@/components/ui/Container';
import { Disclosure } from '@/components/ui/Disclosure';
import type { Dictionary } from '@/i18n/getDictionary';

/**
 * FAQ, plus FAQPage structured data. The markup and the structured data come
 * from the same dictionary entries, so they can never drift apart.
 */
export function Faq({ dict }: { dict: Dictionary }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-20 border-t border-line-soft bg-surface py-14">
      <Container>
        <h2 className="font-head text-2xl font-semibold">{dict.faq.title}</h2>
        <div className="mt-6 max-w-[76ch]">
          {dict.faq.items.map((item) => (
            <Disclosure key={item.question} summary={item.question}>
              {item.answer}
            </Disclosure>
          ))}
        </div>
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
