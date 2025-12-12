// src/services/auth.js
const AUTH_KEY = 'society_auth';

/** Save auth info safely */
export const setAuth = (obj) => {
  const normalized = { ...obj };
  if (obj.user_id && !obj.id) normalized.id = obj.user_id;
  if (obj.id && !obj.user_id) normalized.user_id = obj.id;
  localStorage.setItem(AUTH_KEY, JSON.stringify(normalized));
};

/** decode base64 JSON safely */
const safeDecode = (b64) => {
  try {
    return JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

/** check token expiry from JWT payload */
const isTokenExpired = (token) => {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length < 2) return true;
  const payload = safeDecode(parts[1]);
  if (!payload) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
};

/** Get current auth info (null if missing/expired) */
export const getAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (parsed?.token) {
      if (isTokenExpired(parsed.token)) {
        clearAuth();
        return null;
      }
    } else {
      const separateToken = localStorage.getItem('token');
      if (separateToken) {
        if (isTokenExpired(separateToken)) {
          clearAuth();
          return null;
        }
        parsed.token = separateToken;
      } else return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

/** Clear auth info */
export const clearAuth = () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_role');
};

/** Require login for protected pages */
export const requireAuth = (navigate) => {
  const auth = getAuth();
  if (!auth || !auth.token) {
    setTimeout(() => navigate('/login', { replace: true }), 0);
    return null;
  }
  return auth;
};
