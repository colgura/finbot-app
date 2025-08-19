// screens/SettingsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { colors, fontSizes, fontWeights } from "../styles/theme";
import { useI18n } from "../src/context/i18nContext";
import { useAuth } from "../src/context/AuthContext";

const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

// defensive JSON parse in case server returns non-JSON
const safeJSON = (txt) => {
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { lang, setLang, t } = useI18n();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [localProfile, setLocalProfile] = useState(null);
  const [email, setEmail] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(["userId", "userProfile"]);
        const map = Object.fromEntries(entries);

        // local profile (defensive parse)
        if (map.userProfile) {
          try {
            setLocalProfile(JSON.parse(map.userProfile));
          } catch {
            // ignore bad local JSON
          }
        }

        // server profile (defensive fetch/parse so the app never crashes)
        const uid = map.userId;
        if (uid) {
          const r = await fetch(`${API_BASE}/profile/${uid}`, {
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const text = await r.text();
          const data = safeJSON(text);
          if (r.ok && data && data.ok) {
            setEmail(data?.profile?.email || data?.account?.email || null);
          }
        }
      } catch (e) {
        console.warn("Load settings error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleLogout = async () => {
    Alert.alert(t("settings.logout"), "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: t("settings.logout"),
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["authToken", "userId"]);
          // IMPORTANT: our app uses Login/Register (not "Auth")
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  const resetOnboarding = async () => {
    // Make sure onboarding really resets
    await AsyncStorage.multiRemove([
      "hasOnboarded",
      "authToken",
      "userId",
      "userProfile",
    ]);
    navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
  };

  const clearLocalCache = async () => {
    Alert.alert(
      t("settings.clearLocal"),
      "This will remove saved profile and token on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: t("settings.clearLocal"),
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              "authToken",
              "userId",
              "userProfile",
              "lang",
              "hasOnboarded",
            ]);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  const displayName = localProfile?.name ?? "(No name set)";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("settings.title")}</Text>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.language")}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            onPress={() => setLang("english")}
            style={[styles.pill, lang === "english" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                lang === "english" && styles.pillTextActive,
              ]}
            >
              {t("lang.english")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLang("shona")}
            style={[styles.pill, lang === "shona" && styles.pillActive]}
          >
            <Text
              style={[
                styles.pillText,
                lang === "shona" && styles.pillTextActive,
              ]}
            >
              {t("lang.shona")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("account")}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{displayName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email ?? "(not set)"} </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { marginTop: 12 }]}
          onPress={() => navigation.navigate("Onboarding")}
        >
          <Text style={styles.buttonText}>{t("settings.editProfile")}</Text>
        </TouchableOpacity>
      </View>

      {/* Security */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("Security")}</Text>
        <TouchableOpacity style={styles.buttonAlt} onPress={handleLogout}>
          <Text style={styles.buttonAltText}>{t("Logout")}</Text>
        </TouchableOpacity>
      </View>

      {/* Maintenance */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("settings.maintenance")}</Text>
        <TouchableOpacity style={styles.buttonAlt} onPress={resetOnboarding}>
          <Text style={styles.buttonAltText}>
            {t("settings.resetOnboarding")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonAlt, { marginTop: 8 }]}
          onPress={clearLocalCache}
        >
          <Text style={styles.buttonAltText}>{t("settings.clearLocal")}</Text>
        </TouchableOpacity>
      </View>

      {/* About — show only if you actually have an "About" route */}
      {false ? (
        <TouchableOpacity
          style={[styles.button, { marginTop: 16 }]}
          onPress={() => navigation.navigate("About")}
        >
          <Text style={styles.buttonText}>{t("settings.about")}</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  container: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#0F1A30",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  cardTitle: {
    color: "#E6EEF8",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1B2947",
  },
  label: { color: "#9BB0C5" },
  value: { color: "#E6EEF8", fontWeight: "700" },

  // Language pills
  langRow: { flexDirection: "row", marginTop: 6 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#1B2947",
    borderRadius: 20,
    marginRight: 10,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { color: "#E6EEF8", fontWeight: "700" },
  pillTextActive: { color: "#fff", fontWeight: "800" },

  // Buttons
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800" },
  buttonAlt: {
    backgroundColor: "#1B2947",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  buttonAltText: { color: "#E6EEF8", fontWeight: "700" },
});
