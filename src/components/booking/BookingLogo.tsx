import Image from 'next/image';

/**
 * Booking.com's wordmark (their own two blues), on a white chip so it reads
 * the same on the night card, on a white card and in dark mode. The file is
 * the published wordmark redrawn as plain paths, with nothing executable in
 * it — `tests/booking-links.test.ts` checks that.
 */
export function BookingLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-[10px] bg-white px-3 py-2 ${className}`}>
      <Image src="/providers/booking.svg" alt="Booking.com" width={118} height={20} unoptimized className="h-5 w-auto" />
    </span>
  );
}
