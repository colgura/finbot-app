// context/LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("english");

  useEffect(() => {
    const loadLang = async () => {
      const saved = await AsyncStorage.getItem("preferredLanguage");
      if (saved) setLanguage(saved);
    };
    loadLang();
  }, []);

  const updateLanguage = async (lang) => {
    await AsyncStorage.setItem("preferredLanguage", lang);
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
