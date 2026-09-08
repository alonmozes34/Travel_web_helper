'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { CURRENCY_COOKIE, isCurrency, type CurrencyCode } from '@/i18n/config';

/**
 * The chosen display currency lives in a cookie so the server sees it too and
 * can render prices in the right currency on the first paint. It is read
 * through useSyncExternalStore, which lets the server render the default and
 * the client correct it after hydration without a mismatch.
 *
 * Cookies can be unavailable or blocked, so an in-memory value backs it up and
 * every access is guarded.
 */
const listeners = new Set<() => void>();
let memoryValue: CurrencyCode | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function readCookie(): CurrencyCode | null {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`),
    );
    const value = match ? decodeURIComponent(match[1]) : null;
    if (value && isCurrency(value)) return value;
  } catch {
    // Fall through to the in-memory value.
  }
  return memoryValue;
}

/** The server renders the locale default; the client corrects it if needed. */
function readServer(): CurrencyCode | null {
  return null;
}

function writeCookie(next: CurrencyCode) {
  memoryValue = next;
  try {
    // A year, scoped to the whole site, and not sent on cross-site requests.
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // The preference simply will not persist across sessions.
  }
  listeners.forEach((listener) => listener());
}

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  defaultCurrency,
  children,
}: {
  defaultCurrency: CurrencyCode;
  children: ReactNode;
}) {
  const stored = useSyncExternalStore(subscribe, readCookie, readServer);
  const setCurrency = useCallback((next: CurrencyCode) => writeCookie(next), []);

  return (
    <CurrencyContext.Provider value={{ currency: stored ?? defaultCurrency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used inside a CurrencyProvider');
  return context;
}
