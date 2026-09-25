import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { Brand } from './Brand';
import { CurrencySwitcher } from './CurrencySwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';
import { MobileMenu } from './MobileMenu';
import { mainNavLinks } from './navLinks';

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = mainNavLinks(locale, dict);

  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-surface">
      {/*
        Wraps rather than overflows. A fifth navigation item pushed the
        currency switcher 124px off the edge at 200% text on a 1280px
        viewport, which fails WCAG 1.4.4 — and a viewport breakpoint cannot
        fix that, because at 200% the text is twice the size the breakpoint
        assumed. Letting the row wrap is size-independent: at ordinary text
        nothing moves, and at large text the header becomes two lines instead
        of scrolling sideways.
      */}
      <Container className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3">
        <Brand locale={locale} dict={dict} />

        {/*
          The inline nav appears at lg, not md. A fourth item ("device
          compatibility") made every label wrap onto two lines between 768px
          and 900px, which pushed the header to 53px rows of broken Hebrew.
          Below lg the same links are in the menu button beside it.
        */}
        <nav aria-label={dict.nav.label} className="hidden min-w-0 lg:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-base font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} label={dict.header.languageLabel} />
          </div>
          {/* On a phone only the other language is shown, so it fits beside
              the currency and the menu button at 320px. It is in the menu
              too, but a reader who cannot read this page's language will not
              look for it there. */}
          <div className="sm:hidden">
            <LocaleSwitcher locale={locale} label={dict.header.languageLabel} variant="other" />
          </div>
          <CurrencySwitcher label={dict.header.currencyLabel} />
          <MobileMenu
            locale={locale}
            languageLabel={dict.header.languageLabel}
            links={links}
            openLabel={dict.nav.openMenu}
            closeLabel={dict.nav.closeMenu}
            title={dict.nav.menuTitle}
          />
        </div>
      </Container>
    </header>
  );
}
