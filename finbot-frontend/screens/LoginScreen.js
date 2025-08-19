// screens/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import FinBotLogo from "../assets/FinBotLogo.png";
import { colors, fontSizes } from "../styles/theme";

// single source of truth for the light gray UI background
const UI_BG = "#EEF2F7"; // ← used for top banner AND inputs
const PLACEHOLDER = "#6B7280";

export default function LoginScreen() {
  const nav = useNavigation();
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [human, setHuman] = useState(true);
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please provide email and password.");
      return;
    }

     if (!human) {
       alert("Please confirm you are human 🙂");
       return;
     }

    setBusy(true);
    try {
      await signInWithPassword({ email, password, human: true });
      nav.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      Alert.alert("Login failed", e.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar (flat, light gray) */}
        <View style={styles.topBar}>
          <Image source={FinBotLogo} style={styles.topLogo} />
          <Text style={styles.topBrand}>FinBot</Text>
        </View>

        {/* Big rounded logo */}
        <View style={styles.brandLogoWrap}>
          <Image source={FinBotLogo} style={styles.logo} />
        </View>

        {/* Titles */}
        <View style={styles.titles}>
          <Text style={styles.h1Left}>Welcome back!</Text>
          <Text style={styles.subCentered}>
            You’re invited to try FinBot – an AI-powered Investment Assistant.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.labelRow}>
            <Text style={styles.labelText}>Email</Text>
            <Text style={styles.required}> *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Password */}
          <View style={[styles.labelRow, { marginTop: 14 }]}>
            <Text style={styles.labelText}>Password</Text>
            <Text style={styles.required}> *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Human toggle */}
          <View style={styles.humanRow}>
            <Switch value={human} onValueChange={setHuman} />
            <Text style={styles.humanLabel}>I am human</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.btn, busy && { opacity: 0.7 }]}
            onPress={onLogin}
            disabled={busy}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>
              {busy ? "Signing in…" : "Sign in"}
            </Text>
          </TouchableOpacity>

          {/* Register link */}
          <TouchableOpacity
            onPress={() => nav.navigate("Register")}
            style={{ marginTop: 16, alignItems: "center" }}
          >
            <Text style={{ color: colors.primary }}>
              Don’t have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Top bar
  topBar: {
    height: 56,
    backgroundColor: "#f3f4f6", // light gray like inputs
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topLogo: {
    width: 22,
    height: 22,
    resizeMode: "cover",
    borderRadius: 6, // rounded corners
  },
  topBrand: {
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },

  // Big centered logo
  brandLogoWrap: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  logo: {
    width: 84,
    height: 84,
    resizeMode: "cover",
    borderRadius: 12, // rounded corners
  },

  // Titles
  titles: { paddingHorizontal: 18, marginTop: 8 },
  h1Left: {
    fontSize: fontSizes.heading,
    fontWeight: "700",
    textAlign: "left",
    color: "#0A1F44",
    marginBottom: 6,
    letterSpacing: 0.2,
    LineHeight: 28,
  },
  subCentered: {
    textAlign: "center",
    color: "#667085",
    lineHeight: 20,
    marginBottom: 18,
  },

  // Form
  form: { paddingHorizontal: 18, marginTop: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  labelText: {
    color: "#444",
    fontSize: fontSizes.label,
    fontWeight: "600",
    lineHeight: "18",
    marginTop: 8,
    marginBottom: 6,
  },
  required: {
    color: "red",
    fontWeight: "700",
  },
  input: {
    backgroundColor: UI_BG,
    borderWidth: 1,
    // borderColor: "#e5e7eb",
    borderColor: "#D8DFEA",
    borderRadius: 8,
    paddingHoriznotal: 12,
    paddingVertical: 12,
    // backgroundColor: "#fff",
    marginBottom: 10,
  },
  humanRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 8,
  },
  humanLabel: {
    marginLeft: 10,
    color: "#444",
  },

  btn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    lineHeight: 20,
  },
});
