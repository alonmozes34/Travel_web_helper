import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { AffiliateDisclosure } from '@/components/content/AffiliateDisclosure';
import { Ltr } from '@/components/ui/Bdi';
import { buildCommit, releasedOn, siteVersion } from '@/lib/version';
import { localePath, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { Brand } from './Brand';
import { mainNavLinks } from './navLinks';

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = mainNavLinks(locale, dict);
  /**
   * Only routes that exist. All three of these were dead links site-wide
   * once, because a privacy notice and terms of use have to name who
   * operates the service and how to reach them, and inventing either is the
   * one thing this project never does with a legal page.
   *
   * They are written now, on facts rather than a template: the operator is a
   * private individual with no registered entity, reachable at the site's own
   * address, and the privacy notice is generated from the constants the code
   * actually stores with.
   */
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
          <p className="mt-4 max-w-[46ch] text-base text-ink-2">{dict.footer.aboutText}</p>
        </div>

        <nav aria-label={dict.footer.productTitle}>
          <h2 className="text-sm font-semibold text-ink-2">
            {dict.footer.productTitle}
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-6 items-center text-base text-ink-2 hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={dict.footer.legalTitle}>
          <h2 className="text-sm font-semibold text-ink-2">
            {dict.footer.legalTitle}
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-6 items-center text-base text-ink-2 hover:text-brand">
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
          <div className="text-sm text-ink-3">
            <p>
              © {new Date().getFullYear()} {dict.brand.name}. {dict.footer.rights}.
            </p>
            {/* Which build is live: the version, the day it was released, and
                the commit the host built — so a change can be checked on the
                site itself rather than guessed at. */}
            <p className="mt-1">
              {dict.footer.versionLabel} <Ltr className="tnum">{siteVersion}</Ltr>
              {' · '}
              <Ltr className="tnum">{releasedOn}</Ltr>
              {buildCommit ? (
                <>
                  {' · '}
                  <Ltr className="tnum">{buildCommit}</Ltr>
                </>
              ) : null}
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
