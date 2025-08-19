// src/context/i18nContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    // Aliases to match any legacy calls you might still have
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

    // Aliases (legacy keys)
    account: "Akaunti",
    Security: "Chengetedzo",
    Logout: "Kubuda",
  },
};

function getByPath(obj, path) {
  return path
    .split(".")
    .reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

const I18nCtx = createContext({
  lang: "english",
  setLang: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState("english");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("lang");
      if (saved && STRINGS[saved]) setLang(saved);
    })();
  }, []);

  const value = useMemo(() => {
    const t = (key) => {
      // Try selected language
      const fromSel = getByPath(STRINGS[lang] || {}, key);
      if (fromSel != null) return fromSel;
      // Fallback to English
      const fromEn = getByPath(STRINGS.english, key);
      if (fromEn != null) return fromEn;
      // Last resort: return the key itself
      return key;
    };

    const setLangPersist = async (next) => {
      if (!STRINGS[next]) return;
      setLang(next);
      await AsyncStorage.setItem("lang", next);
    };

    return { lang, setLang: setLangPersist, t };
  }, [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
