import { getPhpBaseUrl } from './PhpBaseUrl';
import { saveCurrentUser, type AuthenticatedUser } from './GoogleSignIn';

function clearUser(): void {
  try { localStorage.removeItem('hanahakuCurrentUser'); } catch { /* Storage may be unavailable. */ }
}
async function request(endpoint: string): Promise<{ ok: boolean; user?: AuthenticatedUser | null; error?: string }> {
  const base = getPhpBaseUrl();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${base}/${endpoint}.php`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: '{}', signal: controller.signal, cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error ?? 'サーバーに接続できません。');
    return result;
  } finally { window.clearTimeout(timeout); }
}
export async function restoreSession(): Promise<boolean> {
  clearUser();
  const result = await request('session');
  if (!result.user) return false;
  saveCurrentUser(result.user);
  return true;
}
export async function logout(): Promise<void> {
  await request('logout');
  clearUser();
}
