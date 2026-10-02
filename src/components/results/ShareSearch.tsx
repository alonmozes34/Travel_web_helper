'use client';

/**
 * "Send on WhatsApp": a plain wa.me link with a ready sentence and this
 * search's own address, so whoever plans the trip with you opens exactly
 * these results — destination, days and filters (the owner, 2 October 2026).
 * On a plan card the sentence names that plan.
 *
 * WhatsApp's green, so it reads as WhatsApp at a glance — the owner found the
 * first, outlined version unclear. Dark text on it: white on that green does
 * not reach 4.5:1.
 *
 * A link and nothing more: no share counter, no tracking parameter. The
 * address is read when the link is followed, so filters chosen after the
 * page loaded go with it.
 */
export function ShareSearch({
  message,
  label,
  opensInNewTab,
  initialUrl = '',
  compact = false,
  context,
}: {
  /** The sentence before the link, e.g. "eSIM plans for Japan, 10 days:". */
  message: string;
  label: string;
  opensInNewTab: string;
  /** The page's address as the server knows it; the browser's is used when followed. */
  initialUrl?: string;
  /** The smaller size for a plan card's row of buttons. */
  compact?: boolean;
  /**
   * Which plan, for screen readers: ten cards each with a link called "Send
   * on WhatsApp" would be ten identical links in a list of links.
   */
  context?: string;
}) {
  const hrefFor = (url: string) => `https://wa.me/?text=${encodeURIComponent(url ? `${message} ${url}` : message)}`;
  return (
    <a
      href={hrefFor(initialUrl)}
      target="_blank"
      rel="noopener"
      onClick={(event) => {
        event.currentTarget.href = hrefFor(window.location.href);
      }}
      className={
        'inline-flex items-center gap-2 rounded-md bg-[#25D366] font-semibold text-[#0b2e17] hover:bg-[#1fb857] ' +
        (compact ? 'min-h-11 px-3 text-sm' : 'min-h-11 px-4 text-base')
      }
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-current">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z" />
      </svg>
      {label}
      {context ? <span className="sr-only">: {context}</span> : null}
      <span className="sr-only"> {opensInNewTab}</span>
    </a>
  );
}
