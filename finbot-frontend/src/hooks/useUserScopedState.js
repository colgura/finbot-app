// src/hooks/useUserScopedState.js
import { useEffect, useState } from "react";
import { getNamespaced, setNamespaced } from "../utils/storage";
import { useAuth } from "../context/AuthContext";

export default function useUserScopedState(key, initialValue) {
  const { userId } = useAuth();
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await getNamespaced(userId, key, initialValue);
      if (mounted) setState(v);
    })();
    return () => {
      mounted = false;
    };
  }, [userId, key]);

  useEffect(() => {
    if (userId == null) return;
    setNamespaced(userId, key, state);
  }, [userId, key, state]);

  return [state, setState];
}
