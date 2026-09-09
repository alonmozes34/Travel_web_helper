import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'quiet';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 font-head font-semibold ' +
  'border border-transparent transition-colors disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover',
  secondary: 'bg-surface text-brand border-line hover:border-brand',
  quiet: 'bg-transparent text-brand hover:bg-brand-50',
};

// Every button is 44px tall on a phone — including the compact size, which
// otherwise put the single most important control on the page (the one that
// sends a traveller to the provider) at 36px under a thumb. WCAG 2.2 AA only
// asks for 24px, but 24px is a floor for not failing, not a size anyone can
// hit while walking through an airport. From `md` up, where there is a mouse,
// the compact size goes back to 36px so a results row stays a results row.
const sizes: Record<Size, string> = {
  sm: 'min-h-11 md:min-h-9 rounded-sm px-4 text-sm',
  md: 'min-h-11 rounded-md px-5 text-base',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
