// src/services/auth.js
// Simple auth helpers (localStorage)
const AUTH_KEY = 'society_auth';

/** ✅ Save auth info safely */
export const setAuth = (obj) => {
  const normalized = { ...obj };
  if (obj.user_id && !obj.id) normalized.id = obj.user_id;
  if (obj.id && !obj.user_id) normalized.user_id = obj.id;

  console.log('🟢 [Auth] Saving auth to localStorage:', normalized);
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

/** check token expiry from JWT payload (returns true if expired) */
const isTokenExpired = (token) => {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length < 2) return true;
  const payload = safeDecode(parts[1]);
  if (!payload) return true;
  // exp is in seconds
  if (!payload.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
};

/** ✅ Get current auth info (returns null if missing/invalid/expired) */
export const getAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    console.log('🔵 [Auth] Raw localStorage:', raw);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // If token present in normalized auth object, validate expiry
    if (parsed?.token) {
      if (isTokenExpired(parsed.token)) {
        console.warn('⚠️ [Auth] Token expired — clearing auth');
        clearAuth();
        return null;
      }
    } else {
      // no token in normalized object. But if separate token key exists, prefer that:
      const separateToken = localStorage.getItem('token');
      if (separateToken) {
        if (isTokenExpired(separateToken)) {
          console.warn('⚠️ [Auth] Separate token expired — clearing auth');
          clearAuth();
          return null;
        }
        // merge separate token into parsed for compatibility
        parsed.token = separateToken;
      } else {
        return null;
      }
    }

    console.log('🔵 [Auth] Parsed auth (valid):', parsed);
    return parsed;
  } catch (err) {
    console.error('❌ [Auth] Failed to parse localStorage auth:', err);
    return null;
  }
};

/** ✅ Clear auth info */
export const clearAuth = () => {
  console.log('🟠 [Auth] Clearing auth info');
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_role');
};

/**
 * ✅ Require login for any protected page.
 * - Pass `navigate` from `useNavigate()`.
 * - Returns auth object if logged in, otherwise redirects and returns null.
 */
export const requireAuth = (navigate) => {
  const auth = getAuth();
  console.log('🧩 [Auth] requireAuth:', auth);

  if (!auth || !auth.token) {
    console.warn('🚫 [Auth] No valid login found — redirecting to /login');
    // small delay to avoid React render issues
    setTimeout(() => navigate('/login', { replace: true }), 0);
    return null;
  }

  return auth;
};
