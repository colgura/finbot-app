// src/context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [t, o] = await AsyncStorage.multiGet([
          "authToken",
          "hasOnboarded",
        ]).then((pairs) => pairs.map((p) => p[1]));
        if (t) setToken(t);
        if (o === "1") setHasOnboarded(true);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Basic setter used by other helpers
  const signIn = async (jwt, user) => {
    await AsyncStorage.setItem("authToken", jwt);
    if (user) {
      const name = user.full_name || user.name || "";
      await AsyncStorage.setItem("userProfile", JSON.stringify({ name }));
      if (user.id) await AsyncStorage.setItem("userId", String(user.id));
    }
    setToken(jwt);
  };

  const signOut = async () => {
    await AsyncStorage.multiRemove(["authToken", "userProfile", "userId"]);
    setToken(null);
  };

  const markOnboarded = async () => {
    await AsyncStorage.setItem("hasOnboarded", "1");
    setHasOnboarded(true);
  };

  // // add inside AuthProvider, next to markOnboarded/signOut
  // const resetOnboarding = async () => {
  //   await AsyncStorage.multiRemove([
  //     "authToken",
  //     "hasOnboarded",
  //     "userProfile",
  //     "userId",
  //   ]);
  //   setToken(null);
  //   setHasOnboarded(false);
  // };
  // add this function in AuthProvider, next to signIn/signOut/etc
  const resetOnboarding = async () => {
    await AsyncStorage.multiRemove([
      "hasOnboarded",
      "authToken",
      "userProfile",
      "userId",
    ]);
    setHasOnboarded(false);
    setToken(null);
  };

  
  /** Convenience: login via backend */
  const signInWithPassword = async ({ email, password, human = true }) => {
    const res = await api("/auth/login", {
      method: "POST",
      body: { email, password, human },
    });
    await signIn(res.token, res.user);
    return res;
  };

  /** Convenience: signup via backend */
  const signUpWithPassword = async ({
    fullName,
    email,
    password,
    human = true,
  }) => {
    const res = await api("/auth/signup", {
      method: "POST",
      body: { fullName, email, password, human },
    });
    await signIn(res.token, { name: fullName });
    return res;
  };

  const value = useMemo(
    () => ({
      booting,
      token,
      hasOnboarded,
      signIn,
      signOut,
      markOnboarded,
      signInWithPassword,
      signUpWithPassword,
      resetOnboarding, // <-- expose it
    }),
    [booting, token, hasOnboarded]
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
