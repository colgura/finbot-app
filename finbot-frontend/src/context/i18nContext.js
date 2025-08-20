// src/context/i18nContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANG_KEY = "lang";

const STRINGS = {
  english: {
    lang: { english: "English", shona: "Shona" },
    settings: {
      title: "Settings",
      language: "Language",
      account: "Account",
      security: "Security",
      logout: "Log out",
      maintenance: "Maintenance",
      resetOnboarding: "Reset Onboarding",
      clearLocal: "Clear local data",
      about: "About",
      editProfile: "Edit Profile",
    },
    // legacy aliases
    account: "Account",
    Security: "Security",
    Logout: "Log out",
  },
  shona: {
    lang: { english: "Chirungu", shona: "ChiShona" },
    settings: {
      title: "Zvirongwa",
      language: "Mutauro",
      account: "Akaunti",
      security: "Chengetedzo",
      logout: "Kubuda",
      maintenance: "Kuchengetedza",
      resetOnboarding: "Tangazve Onboarding",
      clearLocal: "Bvisa data yemuno",
      about: "Nezve",
      editProfile: "Gadzirisa Profaira",
    },
    // legacy aliases
    account: "Akaunti",
    Security: "Chengetedzo",
    Logout: "Kubuda",
  },
};

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path
    .split(".")
    .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

const I18nCtx = createContext({
  lang: "english",
  setLang: async () => {},
  t: (k) => k,
  hydrated: false,
});

function I18nProvider({ children }) {
  const [lang, setLangState] = useState("english");
  const [hydrated, setHydrated] = useState(false);

  // Load saved language once
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved && STRINGS[saved]) setLangState(saved);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Persisted setter (ignore invalid codes)
  const setLang = useCallback(async (next) => {
    if (!STRINGS[next]) return;
    setLangState(next);
    try {
      await AsyncStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  // Translator with fallback to English, then key itself
  const t = useCallback(
    (key) => {
      const fromSel = getByPath(STRINGS[lang], key);
      if (typeof fromSel === "string") return fromSel;

      const fromEn = getByPath(STRINGS.english, key);
      if (typeof fromEn === "string") return fromEn;

      return key; // last resort
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, hydrated }),
    [lang, setLang, t, hydrated]
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

// Hook (named) export with correct casing
export const useI18n = () => useContext(I18nCtx);

// Export both ways so any import style works
export { I18nProvider };
export default I18nProvider;
