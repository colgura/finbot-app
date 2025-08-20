// finbot-frontend/services/api.js
import { Platform } from "react-native";

export const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export default async function api(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
    headers = {},
    absolute = false,
  } = options;
  const url =
    absolute || /^https?:\/\//i.test(path) ? path : `${API_BASE}${path}`;

  const reqInit = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
  if (body !== undefined) reqInit.body = JSON.stringify(body);

  console.log(`[api] ${method} ${url}`, body ? JSON.stringify(body) : "");

  const res = await fetch(url, reqInit);
  const text = await res.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data ?? {};
}

export const askFinBot = async (question, language = "english") => {
  try {
    const data = await api("/ask", {
      method: "POST",
      body: { question, language },
    });
    return data.reply ?? "⚠️ No reply field from server.";
  } catch (error) {
    console.error("❌ askFinBot failed:", error.message);
    return "⚠️ Failed to get response from FinBot.";
  }
};
