'use client';

/**
 * "Send on WhatsApp": a plain wa.me link with this search's own address, so
 * whoever plans the trip with you opens exactly these results — destination,
 * days and filters (the owner, 2 October 2026).
 *
 * A link and nothing more: no share counter, no tracking parameter. The
 * address is read when the link is followed, so filters chosen after the
 * page loaded go with it; before that, the address the server rendered.
 */
export function ShareSearch({
  message,
  label,
  opensInNewTab,
  initialUrl,
}: {
  /** The sentence before the link, e.g. "eSIM plans for Japan, 10 days:". */
  message: string;
  label: string;
  opensInNewTab: string;
  initialUrl: string;
}) {
  const hrefFor = (url: string) => `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`;
  return (
    <a
      href={hrefFor(initialUrl)}
      target="_blank"
      rel="noopener"
      onClick={(event) => {
        event.currentTarget.href = hrefFor(window.location.href);
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20z" strokeLinejoin="round" />
      </svg>
      {label}
      <span className="sr-only"> {opensInNewTab}</span>
    </a>
  );
}
