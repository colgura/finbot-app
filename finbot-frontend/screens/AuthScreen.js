// screens/AuthScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useAuth } from "../src/context/AuthContext";
import { colors } from "../styles/theme";

// ✅ Define the image BEFORE using it
const LOGO = require("../assets/FinBotLogo.png");

export default function AuthScreen() {
  const { logInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("collen@example.com");
  const [password, setPassword] = useState("MyStrongPass1!");
  const [human, setHuman] = useState(true);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!human) {
      Alert.alert("Confirm", "Please confirm you are human.");
      return;
    }
    try {
      setBusy(true);
      if (mode === "signin") {
        await logInWithPassword({ email, password });
      } else {
        if (!fullName.trim()) {
          Alert.alert("Validation", "Full name is required.");
          return;
        }
        await signUpWithPassword({
          fullName: fullName.trim(),
          email,
          password,
        });
      }
    } catch (e) {
      Alert.alert("Auth Error", e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "#ECF2FF" /* lighter, more welcoming */,
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header with small logo + name */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image
            source={LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="FinBot logo"
          />
          <Text style={styles.brand}>FinBot</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.body}>
        {/* Optional big logo */}
        <Image source={LOGO} style={styles.heroLogo} resizeMode="contain" />

        <Text style={styles.title}>
          {mode === "signInWithPassword"
            ? "Welcome back"
            : "Create your FinBot account"}
        </Text>
        <Text style={styles.subtitle}>
          You are invited to try FinBot — a ChatGPT-powered financial learning
          assistant.
        </Text>

        {mode === "signup" && (
          <>
            <Text style={styles.label}>
              Full name <Text style={{ color: "#ff6b6b" }}>*</Text>
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              style={styles.input}
              autoCapitalize="words"
            />
          </>
        )}

        <Text style={styles.label}>
          Email <Text style={{ color: "#ff6b6b" }}>*</Text>
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>
          Password <Text style={{ color: "#ff6b6b" }}>*</Text>
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          style={styles.input}
          secureTextEntry
        />

        <View style={styles.row}>
          <Switch value={human} onValueChange={setHuman} />
          <Text style={{ color: "#22304A", marginLeft: 8 }}>I am human</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          <Text style={styles.btnText}>
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: "#5B7290", textAlign: "center" }}>
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 28, height: 28, marginRight: 8 },
  brand: { color: "#0A1F44", fontWeight: "800", fontSize: 18 },

  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
  },
  heroLogo: {
    width: 96,
    height: 96,
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  title: {
    color: "#0A1F44",
    fontWeight: "800",
    fontSize: 22,
  },
  subtitle: {
    color: "#5B7290",
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
  },
  label: {
    color: "#3B4B68",
    marginTop: 10,
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#F0F4FF",
    color: "#0A1F44",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
