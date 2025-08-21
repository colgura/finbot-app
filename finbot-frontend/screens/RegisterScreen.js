// screens/RegisterScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";
import { colors, fontSizes } from "../styles/theme";

export default function RegisterScreen() {
  const nav = useNavigation();

  // ✅ use the helpers exactly as exported by AuthContext
  const { signUpWithPassword, markOnboarded } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [human, setHuman] = useState(true);
  const [busy, setBusy] = useState(false);

  const onSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Missing info", "Please complete all required fields.");
      return;
    }
    if (!human) {
      Alert.alert("Verification", "Please confirm you're human.");
      return;
    }

    setBusy(true);
    try {
      // ✅ calls backend + persists token via AuthContext
      await signUpWithPassword({ fullName, email, password, human: true });

      // ✅ flip onboarding flag so routing doesn’t bounce you back
      await markOnboarded();

      // ✅ go straight to the app
      nav.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      // e.message comes from api() helper if server returns {error: "..."}
      Alert.alert("Sign up failed", e?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>FinBot</Text>

      <Text style={styles.label}>
        Full name <Text style={styles.star}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
      />

      <Text style={styles.label}>
        Email <Text style={styles.star}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />

      <Text style={styles.label}>
        Password <Text style={styles.star}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
      />

      {/* Optional human toggle like your earlier design */}
      <View style={styles.row}>
        <Text style={{ color: "#444" }}>I am human</Text>
        <Switch value={human} onValueChange={setHuman} />
      </View>

      <TouchableOpacity
        style={[styles.btn, busy && { opacity: 0.7 }]}
        onPress={onSignup}
        disabled={busy}
      >
        <Text style={styles.btnText}>
          {busy ? "Creating account..." : "Sign up"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => nav.navigate("Login")}
        style={{ marginTop: 16 }}
      >
        <Text style={{ color: colors.primary }}>
          Already have an account? Sign in
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, justifyContent: "center" },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 24,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: "#444",
    fontSize: fontSizes.label,
  },
  star: { color: "red", fontWeight: "800" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  row: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "#fff", fontWeight: "800" },
});
