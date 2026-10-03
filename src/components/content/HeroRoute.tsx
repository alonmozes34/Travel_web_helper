/**
 * The first screen's decoration: a dotted flight route between two glowing
 * cities, with a plane on it. Purely ornamental — hidden from assistive
 * technology, drawn in on-night tones so forced-colours mode keeps it
 * faint, and still under reduced motion.
 */
export function HeroRoute({ rtl }: { rtl: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 600 260"
        className="absolute end-6 top-10 hidden w-[540px] max-w-none opacity-80 lg:block"
        style={rtl ? { transform: 'scaleX(-1)' } : undefined}
      >
        <path
          d="M60 230 C 200 30, 420 10, 560 140"
          fill="none"
          stroke="rgb(195 210 230 / 0.45)"
          strokeWidth="2.5"
          strokeDasharray="3 11"
          strokeLinecap="round"
          className="motion-safe:animate-[route-dash_6s_linear_infinite]"
        />
        <circle cx="60" cy="230" r="7" fill="#16bfb6" />
        <circle cx="60" cy="230" r="18" fill="#16bfb6" opacity="0.18" />
        <circle cx="560" cy="140" r="7" fill="#6cc0ff" />
        <circle cx="560" cy="140" r="20" fill="#6cc0ff" opacity="0.18" />
        <g transform="translate(310 62) rotate(-8)">
          <path
            d="M-14 -0.8 L8 -2 C12 -2 15 -1 15 0 C15 1 12 2 8 2 L-14 0.8 Z M-2 -1.6 L-7 -11 L-3.6 -11 L4 -1.8 Z M-2 1.6 L-7 11 L-3.6 11 L4 1.8 Z M-11 -0.7 L-13.5 -6 L-11.5 -6 L-8 -0.9 Z M-11 0.7 L-13.5 6 L-11.5 6 L-8 0.9 Z"
            transform="scale(1.9)"
            fill="#ffffff"
          />
        </g>
      </svg>
    </div>
  );
}
