// src/context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api"; // <-- uses your services/api.js
// Optional: if you created this earlier. If not, you can remove the import + calls.
import { clearUserNamespace as _clearUserNs } from "../utils/storage";

const K_TOKEN = "authToken";
const K_USERID = "userId";
const K_PROFILE = "userProfile";
const K_ONBOARDED = "hasOnboarded";

// no-op fallback if utils/storage isn't present
const clearUserNamespace =
  typeof _clearUserNs === "function" ? _clearUserNs : async () => {};

const AuthCtx = createContext({
  // state
  booting: true,
  token: null,
  hasOnboarded: false,
  userId: null,
  profile: null,

  // auth methods
  signIn: () => {},
  signOut: () => {},
  signInWithPassword: async () => {},
  signUpWithPassword: async () => {},
  markOnboarded: async () => {},
  resetOnboarding: async () => {},

  // password reset
  requestPasswordReset: async () => {},
  resetPasswordWithCode: async () => {},
});

const normEmail = (e) => (e || "").trim().toLowerCase();
const normText = (s) => (s || "").trim();

export function AuthProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);

  // -------- Boot: load persisted auth --------
  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          K_TOKEN,
          K_USERID,
          K_PROFILE,
          K_ONBOARDED,
        ]);
        const map = Object.fromEntries(entries);

        const t = map[K_TOKEN] || null;
        const uid = map[K_USERID] ? Number(map[K_USERID]) : null;
        const prof =
          map[K_PROFILE] && map[K_PROFILE].startsWith("{")
            ? safeJSON(map[K_PROFILE])
            : null;
        const onboard = map[K_ONBOARDED] === "true";

        setToken(t);
        setUserId(uid);
        setProfile(prof);
        setHasOnboarded(onboard);
      } catch (e) {
        // ignore; app will behave as signed-out
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // -------- Helpers to persist session --------
  const persistSession = useCallback(async (tkn, userObj) => {
    const u = userObj || {};
    const uid =
      u.id ?? u.user_id ?? u.uid ?? u._id ?? (typeof u === "number" ? u : null);

    await AsyncStorage.multiSet([
      [K_TOKEN, tkn || ""],
      [K_PROFILE, JSON.stringify(u || {})],
      [K_USERID, uid != null ? String(uid) : ""],
    ]);
    setToken(tkn || null);
    setProfile(u || null);
    setUserId(uid ?? null);
  }, []);

  // -------- Public API: sign-in/up/out --------
  const signIn = useCallback(
    async (tkn) => {
      // Simple setter for legacy code paths
      await persistSession(tkn, profile || {});
    },
    [persistSession, profile]
  );

  const signOut = useCallback(async () => {
    try {
      if (userId != null) await clearUserNamespace(userId);
    } catch {}
    await AsyncStorage.multiRemove([K_TOKEN, K_PROFILE, K_USERID]);
    setToken(null);
    setProfile(null);
    setUserId(null);
    // NOTE: do NOT clear hasOnboarded here; logout should keep onboarding complete
  }, [userId]);

  const signInWithPassword = useCallback(
    async ({ email, password }) => {
      const body = {
        email: normEmail(email),
        username: normEmail(email), // alias for backends that expect "username"
        password: normText(password),
      };
      const res = await api("/auth/login", { method: "POST", body });

      // Accept common variations
      const tkn = res.token || res.accessToken || res.jwt || null;
      const user = res.user || res.account || res.profile || null;
      if (!tkn || !user) {
        throw new Error(res?.error || "Invalid response from server.");
      }
      await persistSession(tkn, user);
    },
    [persistSession]
  );

  const signUpWithPassword = useCallback(
    async ({ fullName, email, password, human = true }) => {
      const body = {
        name: normText(fullName),
        fullName: normText(fullName),
        email: normEmail(email),
        username: normEmail(email),
        password: normText(password),
        human: !!human,
      };
      const res = await api("/auth/register", { method: "POST", body });

      // Accept common variations
      const tkn = res.token || res.accessToken || res.jwt || null;
      const user = res.user || res.account || res.profile || null;
      if (!tkn || !user) {
        throw new Error(res?.error || "Invalid response from server.");
      }
      await persistSession(tkn, user);
    },
    [persistSession]
  );

  const markOnboarded = useCallback(async () => {
    await AsyncStorage.setItem(K_ONBOARDED, "true");
    setHasOnboarded(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      if (userId != null) await clearUserNamespace(userId);
    } catch {}
    await AsyncStorage.multiRemove([K_ONBOARDED, K_TOKEN, K_PROFILE, K_USERID]);
    setHasOnboarded(false);
    setToken(null);
    setProfile(null);
    setUserId(null);
  }, [userId]);

  // -------- Password reset flow --------
  const requestPasswordReset = useCallback(async (email) => {
    const payload = { email: normEmail(email), username: normEmail(email) };

    // Try common endpoint names to reduce backend coupling
    try {
      return await api("/auth/forgot", { method: "POST", body: payload });
    } catch (e1) {
      try {
        return await api("/auth/request-password-reset", {
          method: "POST",
          body: payload,
        });
      } catch (e2) {
        // As a last resort, surface the original error
        throw e2;
      }
    }
  }, []);

  const resetPasswordWithCode = useCallback(
    async ({ email, code, newPassword }) => {
      const payload = {
        email: normEmail(email),
        username: normEmail(email),
        // cover both "code" and "token" field names
        code: normText(code),
        token: normText(code),
        // cover both "password" and "newPassword"
        password: normText(newPassword),
        newPassword: normText(newPassword),
      };

      try {
        return await api("/auth/reset", { method: "POST", body: payload });
      } catch (e1) {
        try {
          return await api("/auth/reset-password", {
            method: "POST",
            body: payload,
          });
        } catch (e2) {
          throw e2;
        }
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      // state
      booting,
      token,
      hasOnboarded,
      userId,
      profile,

      // auth API
      signIn,
      signOut,
      signInWithPassword,
      signUpWithPassword,
      markOnboarded,
      resetOnboarding,

      // password reset
      requestPasswordReset,
      resetPasswordWithCode,
    }),
    [
      booting,
      token,
      hasOnboarded,
      userId,
      profile,
      signIn,
      signOut,
      signInWithPassword,
      signUpWithPassword,
      markOnboarded,
      resetOnboarding,
      requestPasswordReset,
      resetPasswordWithCode,
    ]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

// ---------- utils ----------
function safeJSON(txt) {
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
