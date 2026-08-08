/**
 * Auth token persistence.
 *
 * localStorage keeps the session across reloads and tabs. Access is wrapped so a
 * disabled-storage environment (private mode, embedded webview) degrades to an
 * in-memory session instead of throwing on every read.
 */

const TOKEN_KEY = 'nexus_auth_token';

let memoryFallback: string | null = null;

const canUseLocalStorage = (): boolean => {
  try {
    const probe = '__nexus_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

export const getStoredToken = (): string | null => {
  if (!canUseLocalStorage()) return memoryFallback;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  memoryFallback = token;
  if (canUseLocalStorage()) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearStoredToken = (): void => {
  memoryFallback = null;
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};
