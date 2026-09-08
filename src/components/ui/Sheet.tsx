'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from './cn';

type Side = 'bottom' | 'center';

/**
 * Modal panel built on the native <dialog> element, so focus trapping, the
 * Escape key and inert background come from the platform instead of from us.
 * `bottom` is the mobile sheet; `center` is the desktop modal.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  side = 'bottom',
  panelClassName,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  side?: Side;
  /** Widens the panel for content that needs it, such as the compare table. */
  panelClassName?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // A click that lands on the dialog itself is a backdrop click.
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className={cn(
        'w-full bg-surface text-ink backdrop:bg-ink/40',
        side === 'bottom'
          ? 'mx-auto mt-auto mb-0 max-w-[640px] rounded-t-[20px] shadow-sheet'
          : 'm-auto max-w-[560px] rounded-lg',
        panelClassName,
      )}
    >
      <div className="flex max-h-[80vh] flex-col">
        <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
          <h2 id={titleId} className="font-head text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ms-auto inline-flex size-11 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-2"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ✕
            </span>
            <span className="sr-only">{closeLabel}</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line-soft px-5 py-4">{footer}</div> : null}
      </div>
    </dialog>
  );
}
