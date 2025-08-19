// src/api/client.js
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

/** Safe debug log that doesn't print the password */
function logApi(method, url, body) {
  const masked =
    body && typeof body === "object"
      ? { ...body, password: body.password ? "••••••" : undefined }
      : undefined;
  console.log(`[api] ${method} ${url}`, masked ?? "");
}

export async function api(path, { method = "GET", headers = {}, body } = {}) {
  const token = await AsyncStorage.getItem("authToken");
  const url = `${API_BASE}${path}`;
  logApi(method, url, body);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}
