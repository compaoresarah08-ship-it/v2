export const COOKIE_PREFERENCE_KEY = 'noema_cookie_preference_v3';
type Preference = 'accepted' | 'refused';

export function preferenceExpiry(now: number): number {
  const date = new Date(now);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
}

export function readCookiePreference(storage: Pick<Storage, 'getItem' | 'removeItem'>, now = Date.now()): Preference | null {
  try {
    const raw = storage.getItem(COOKIE_PREFERENCE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if ((value.preference === 'accepted' || value.preference === 'refused') &&
        Number.isFinite(value.chosenAt) && Number.isFinite(value.expiresAt) &&
        value.chosenAt <= now && value.expiresAt > now &&
        value.expiresAt === preferenceExpiry(value.chosenAt)) return value.preference;
    storage.removeItem(COOKIE_PREFERENCE_KEY);
  } catch { /* Storage may be unavailable; ask again without blocking the site. */ }
  return null;
}

export function saveCookiePreference(storage: Pick<Storage, 'setItem' | 'removeItem'>, preference: Preference, now = Date.now()): void {
  try {
    storage.removeItem('noema_cookie_preference_v2');
    storage.setItem(COOKIE_PREFERENCE_KEY, JSON.stringify({ preference, chosenAt: now, expiresAt: preferenceExpiry(now) }));
  } catch { /* A denied browser storage must not break the visitor's session. */ }
}
