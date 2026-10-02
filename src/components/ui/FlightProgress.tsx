/**
 * A flight from Tel Aviv to the destination as the loading bar: a dotted
 * arc, the part already flown drawn solid, and the plane on it at the
 * percentage reached (the owner, 2 October 2026: "something special, maybe a
 * plane flying"). Two clouds drift behind it.
 *
 * The scene is drawn left to right and mirrored for Hebrew, so the plane
 * always flies from the start of the line to its end — from the right in
 * Hebrew. The place names are ordinary text beside it, never mirrored.
 *
 * Decorative: hidden from screen readers, like the bar it replaces. The
 * sentence above it is the live status.
 */

const W = 600;
const H = 150;
const P0 = { x: 40, y: 118 };
const P1 = { x: 300, y: -18 };
const P2 = { x: 560, y: 118 };

function pointAt(t: number) {
  const u = 1 - t;
  const x = u * u * P0.x + 2 * u * t * P1.x + t * t * P2.x;
  const y = u * u * P0.y + 2 * u * t * P1.y + t * t * P2.y;
  const dx = 2 * u * (P1.x - P0.x) + 2 * t * (P2.x - P1.x);
  const dy = 2 * u * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

const ARC = `M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

/** A small airliner pointing right, centred on 0,0. */
const PLANE =
  'M-14 -0.8 L8 -2 C12 -2 15 -1 15 0 C15 1 12 2 8 2 L-14 0.8 Z ' +
  'M-2 -1.6 L-7 -11 L-3.6 -11 L4 -1.8 Z M-2 1.6 L-7 11 L-3.6 11 L4 1.8 Z ' +
  'M-11 -0.7 L-13.5 -6 L-11.5 -6 L-8 -0.9 Z M-11 0.7 L-13.5 6 L-11.5 6 L-8 0.9 Z';

const CLOUD = 'M0 14 a9 9 0 0 1 9-9 a12 12 0 0 1 22-2 a9 9 0 0 1 11 11 Z';

export function FlightProgress({
  percent,
  rtl,
  from,
  to,
}: {
  percent: number;
  rtl: boolean;
  /** Where the flight leaves from, e.g. "🇮🇱 תל אביב". */
  from: string;
  /** Where it lands: the destination, or a generic "your destination". */
  to: string;
}) {
  const t = Math.max(0, Math.min(100, percent)) / 100;
  const plane = pointAt(t);

  return (
    <div aria-hidden="true" className="max-w-xl">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
        <g transform={rtl ? `translate(${W} 0) scale(-1 1)` : undefined}>
          <g className="fill-surface stroke-line motion-safe:animate-[cloud-drift_9s_ease-in-out_infinite_alternate]" strokeWidth="1.5">
            <path d={CLOUD} transform="translate(120 48) scale(1.3)" />
          </g>
          <g className="fill-surface stroke-line motion-safe:animate-[cloud-drift_12s_ease-in-out_infinite_alternate-reverse]" strokeWidth="1.5">
            <path d={CLOUD} transform="translate(410 26)" />
          </g>

          {/* The route, then the part already flown. */}
          <path d={ARC} fill="none" className="stroke-line" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
          <path
            d={ARC}
            fill="none"
            className="stroke-brand motion-safe:transition-[stroke-dashoffset] motion-safe:duration-150 motion-safe:ease-linear"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100 100"
            strokeDashoffset={100 - t * 100}
          />

          <circle cx={P0.x} cy={P0.y} r="7" className="fill-brand" />
          <circle cx={P0.x} cy={P0.y} r="3" className="fill-surface" />
          <circle cx={P2.x} cy={P2.y} r="7" className="fill-teal" />
          <circle cx={P2.x} cy={P2.y} r="3" className="fill-surface" />

          <g transform={`translate(${plane.x} ${plane.y}) rotate(${plane.angle})`}>
            <g className="motion-safe:animate-[plane-bob_1.6s_ease-in-out_infinite]">
              <path d={PLANE} transform="scale(1.6)" className="fill-ink" />
            </g>
          </g>
        </g>
      </svg>
      <div className="-mt-3 flex items-start justify-between gap-4 px-1 text-sm font-semibold text-ink-2">
        <span>{from}</span>
        <span className="font-head text-2xl font-bold tabular-nums text-ink">{Math.round(percent)}%</span>
        <span className="text-end">{to}</span>
      </div>
    </div>
  );
}
