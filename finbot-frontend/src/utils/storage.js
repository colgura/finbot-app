// src/utils/storage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const NS = "fb:user"; // FinBot namespace

export const nsKey = (userId, key) => `${NS}:${userId}:${key}`;

export async function getNamespaced(userId, key, fallback = null) {
  const raw = await AsyncStorage.getItem(nsKey(userId, key));
  return raw ? JSON.parse(raw) : fallback;
}
export async function setNamespaced(userId, key, value) {
  await AsyncStorage.setItem(nsKey(userId, key), JSON.stringify(value));
}
export async function removeNamespaced(userId, key) {
  await AsyncStorage.removeItem(nsKey(userId, key));
}
export async function clearUserNamespace(userId) {
  const keys = await AsyncStorage.getAllKeys();
  const mine = keys.filter((k) => k.startsWith(`${NS}:${userId}:`));
  if (mine.length) await AsyncStorage.multiRemove(mine);
}
