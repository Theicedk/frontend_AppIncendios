export type AuthSessionUser = {
  email: string;
};

// Guarda en memoria el usuario autenticado actual para compartirlo entre pantallas.
// Esto evita depender solo de un estado local de una pantalla.
let currentUser: AuthSessionUser | null = null;
const AUTH_SESSION_KEY = 'frontend_AppIncendios.authSessionUser';

// Comprueba si estamos en web y si el navegador permite usar localStorage.
const canUseLocalStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// Lee la sesión que quedó guardada en el navegador para restaurarla al refrescar.
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

// Actualiza la sesión en memoria cuando el usuario inicia o cierra sesión.
export const setAuthSessionUser = (user: AuthSessionUser | null) => {
  currentUser = user;

  if (!canUseLocalStorage()) {
    return;
  }

  try {
    if (user) {
      // Si hay usuario, lo guardamos en localStorage para mantener la sesión tras refrescar.
      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      // Si el usuario cierra sesión, borramos el dato persistido.
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // Si el navegador bloquea localStorage, mantenemos solo la sesión en memoria.
  }
};

// Devuelve el usuario actual para que otras pantallas sepan si hay sesión activa.
// Primero usa memoria y, si está vacía, intenta restaurar desde localStorage.
export const getAuthSessionUser = () => currentUser ?? readPersistedUser();

// Indica si la app está en modo anónimo, o sea, sin usuario autenticado.
export const isAnonymousSession = () => getAuthSessionUser() === null;