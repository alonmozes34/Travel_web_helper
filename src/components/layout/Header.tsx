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
      <Container className="flex items-center gap-5 py-3">
        <Brand locale={locale} dict={dict} />

        <nav aria-label={dict.nav.label} className="hidden md:block">
          <ul className="flex items-center gap-6">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.9rem] font-medium text-ink-2 transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} label={dict.header.languageLabel} />
          </div>
          <CurrencySwitcher label={dict.header.currencyLabel} />
          <MobileMenu
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
