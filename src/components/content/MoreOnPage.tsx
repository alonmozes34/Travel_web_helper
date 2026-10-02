/**
 * "Further down this page": one row of buttons, right after the results, to
 * the sections below them — so a traveller who came for prices knows there is
 * more, and can get to it in one tap (the owner, 2 October 2026).
 */
export function MoreOnPage({ title, items }: { title: string; items: Array<{ href: string; icon: string; label: string }> }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={title} className="mt-8 rounded-lg border border-line bg-surface-2 p-4">
      <p className="text-sm font-semibold text-ink-2">{title}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-surface px-4 text-base font-semibold text-ink hover:border-brand hover:text-brand"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
