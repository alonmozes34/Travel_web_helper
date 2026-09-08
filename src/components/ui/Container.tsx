import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * Page gutter. Content maxes out at 1200px so that on wide desktops the extra
 * width goes to the comparison columns rather than the margins.
 */
export function Container({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'header' | 'footer' | 'section' | 'nav' | 'main';
}) {
  return <Tag className={cn('mx-auto w-full max-w-[1200px] px-5', className)}>{children}</Tag>;
}
