import { getItem } from './storage';

export type AuthSessionUser = {
  email: string;
};

let currentUser: AuthSessionUser | null = null;
const AUTH_SESSION_KEY = 'frontend_AppIncendios.authSessionUser';

const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readPersistedUser = (): AuthSessionUser | null => {
  if (!canUseLocalStorage()) {
    return null;
  }
  try {
    const rawValue = window.localStorage.getItem(AUTH_SESSION_KEY);
    return rawValue ? (JSON.parse(rawValue) as AuthSessionUser) : null;
  } catch {
    return null;
  }
};

export const setAuthSessionUser = (user: AuthSessionUser | null) => {
  currentUser = user;
  if (!canUseLocalStorage()) return;
  try {
    if (user) {
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch { /* ignorar */ }
};

export const getAuthSessionUser = () => currentUser ?? readPersistedUser();

/**
 * Verifica si hay sesión activa revisando tanto el token en storage
 * (SecureStore en nativo, localStorage en web) como la memoria.
 * Reemplaza a isAnonymousSession() que nunca funcionó en nativo.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getItem('access_token');
  return token != null;
}

/**
 * @deprecated Usar isAuthenticated() en su lugar.
 * Esta función nunca funcionó en nativo porque setAuthSessionUser no era llamado
 * desde el flujo de login y localStorage no existe en iOS/Android.
 */
export const isAnonymousSession = () => getAuthSessionUser() === null;