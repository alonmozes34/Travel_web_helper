import { isAuthorised } from '@/lib/previewGate';

/**
 * Who may open the dashboard: whoever has `DASHBOARD_PASSWORD`, asked for by
 * the browser's own sign-in box (Basic authentication over HTTPS). The owner,
 * 13 October 2026: "a separate page only I can open".
 *
 * Unset, the page does not exist (404). A short password is refused outright
 * rather than accepted: Basic authentication has no lockout, so the length
 * is the defence against guessing.
 */
export const DASHBOARD_MIN_PASSWORD = 12;

export type DashboardAccess = 'ok' | 'unset' | 'weak' | 'denied';

export function dashboardAccess(authorization: string | null, env: Record<string, string | undefined> = process.env): DashboardAccess {
  const password = env.DASHBOARD_PASSWORD?.trim() ?? '';
  if (!password) return 'unset';
  if (password.length < DASHBOARD_MIN_PASSWORD) return 'weak';
  // A value pasted into Vercel with its quotes around it: either spelling opens.
  const unquoted = /^(["'])(.+)\1$/.exec(password)?.[2]?.trim();
  return [password, unquoted].some((candidate) => candidate && isAuthorised(authorization, candidate)) ? 'ok' : 'denied';
}

export const isDashboardPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');
