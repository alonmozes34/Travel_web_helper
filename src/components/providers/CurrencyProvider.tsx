'use client';

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { currencies, type CurrencyCode } from '@/i18n/config';

const STORAGE_KEY = 'esimcompare.currency';

function isCurrency(value: string): value is CurrencyCode {
  return (currencies as readonly string[]).includes(value);
}

/**
 * The chosen currency lives in localStorage rather than React state so that
 * the value survives navigation and stays in sync across tabs. Storage can be
 * unavailable (private mode, blocked site data), so an in-memory value backs
 * it up and every access is guarded.
 */
const listeners = new Set<() => void>();
let memoryValue: CurrencyCode | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getStoredCurrency(): CurrencyCode | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isCurrency(stored)) return stored;
  } catch {
    // Fall through to the in-memory value.
  }
  return memoryValue;
}

/** The server has no preference to read, so it always renders the default. */
function getServerCurrency(): CurrencyCode | null {
  return null;
}

function writeCurrency(next: CurrencyCode) {
  memoryValue = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
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

/**
 * Holds the display currency. Plan prices keep their source currency in the
 * data model and are converted for display, so this is the single place the
 * rest of the app asks "which currency am I rendering?".
 */
export function CurrencyProvider({
  defaultCurrency,
  children,
}: {
  defaultCurrency: CurrencyCode;
  children: ReactNode;
}) {
  const stored = useSyncExternalStore(subscribe, getStoredCurrency, getServerCurrency);
  const setCurrency = useCallback((next: CurrencyCode) => writeCurrency(next), []);

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
