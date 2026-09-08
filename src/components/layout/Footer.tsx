import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { Brand } from './Brand';
import { mainNavLinks } from './navLinks';

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = mainNavLinks(locale, dict);
  const legalLinks = [
    { href: localePath(locale, '/accessibility'), label: dict.accessibility.navLabel },
    { href: localePath(locale, '/disclosure'), label: dict.footer.disclosureLink },
    { href: localePath(locale, '/privacy'), label: dict.footer.privacy },
    { href: localePath(locale, '/terms'), label: dict.footer.terms },
  ];

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Brand locale={locale} dict={dict} />
          <h2 className="sr-only">{dict.footer.aboutTitle}</h2>
          <p className="mt-4 max-w-[46ch] text-[0.9375rem] text-ink-2">{dict.footer.aboutText}</p>
        </div>

        <nav aria-label={dict.footer.productTitle}>
          <h2 className="text-xs font-semibold tracking-[0.09em] text-ink-3 uppercase">
            {dict.footer.productTitle}
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-6 items-center text-[0.9375rem] text-ink-2 hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={dict.footer.legalTitle}>
          <h2 className="text-xs font-semibold tracking-[0.09em] text-ink-3 uppercase">
            {dict.footer.legalTitle}
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-6 items-center text-[0.9375rem] text-ink-2 hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-line-soft bg-surface-2">
        <Container className="flex flex-col gap-3 py-6 md:flex-row md:items-end md:justify-between">
          <AffiliateDisclosure dict={dict} variant="full" className="max-w-[70ch]" />
          <p className="text-[0.8125rem] text-ink-3">
            © {new Date().getFullYear()} {dict.brand.name}. {dict.footer.rights}.
          </p>
        </Container>
      </div>
    </footer>
  );
}
