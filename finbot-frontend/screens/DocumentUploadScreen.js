// screens/DocumentUploadScreen.js
import React, { useRef, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = Platform.select({
  android: process.env.EXPO_PUBLIC_API_BASE_ANDROID || "http://10.0.2.2:5000",
  ios: process.env.EXPO_PUBLIC_API_BASE_IOS || "http://localhost:5000",
  default: "http://localhost:5000",
});

export default function DocumentUploadScreen() {
  const navigation = useNavigation();
  const [busy, setBusy] = useState(false);
  const [lastFilename, setLastFilename] = useState(null);
  const abortRef = useRef(null);

  const goHome = () => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
      abortRef.current = null;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Home");
  };

  // Header: add "Cancel" button that always returns Home
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Upload Report",
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={goHome} style={{ paddingHorizontal: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#0A1F44" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={goHome} style={{ paddingHorizontal: 12 }}>
          <Text style={{ color: "#0A1F44", fontWeight: "600" }}>Home</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  // Android hardware back: if uploading, treat as cancel-to-home
  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (busy) {
          goHome();
          return true; // we handled it
        }
        return false; // let default back happen
      };
      BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => BackHandler.removeEventListener("hardwareBackPress", onBack);
    }, [busy])
  );

  const pickAndUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;

      const file = res.assets?.[0];
      if (!file) return;

      setLastFilename(file.name || "report.pdf");
      setBusy(true);

      // Build form-data
      const form = new FormData();
      form.append("file", {
        uri: file.uri,
        name: file.name || "report.pdf",
        type: "application/pdf",
      });

      // Abortable fetch
      const controller = new AbortController();
      abortRef.current = controller;

      const r = await fetch(`${API_BASE}/reports/summary`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          // DO NOT set Content-Type for FormData; RN will set the correct boundary
        },
        body: form,
        signal: controller.signal,
      });

      abortRef.current = null;

      if (!r.ok) {
        const err = await safeJson(r);
        throw new Error(err?.error || `Upload failed (${r.status})`);
      }

      const data = await r.json();
      // For now, just show a quick summary and then return Home
      Alert.alert(
        "Upload complete",
        `Pages: ${data.pages}\nFile: ${data.filename}\n\n${
          data.summary ? "Summary received." : "No summary (API key not set)."
        }`,
        [{ text: "OK", onPress: () => navigation.navigate("Home") }]
      );
    } catch (e) {
      if (e.name === "AbortError") {
        // user cancelled; just ignore
      } else {
        Alert.alert("Upload error", e.message || String(e));
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Upload a PDF report</Text>
      <Text style={styles.p}>
        FinBot will extract text and (optionally) generate a short summary to
        help you skim large financial documents.
      </Text>

      {!!lastFilename && (
        <Text style={styles.filename}>Last picked: {lastFilename}</Text>
      )}

      {!busy ? (
        <TouchableOpacity style={styles.btn} onPress={pickAndUpload}>
          <Ionicons
            name="cloud-upload-outline"
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.btnText}>Choose PDF & Upload</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0A1F44" />
          <Text style={{ marginTop: 10, color: "#0A1F44" }}>
            Uploading & parsing…
          </Text>

          <TouchableOpacity style={styles.cancelBtn} onPress={goHome}>
            <Text style={styles.cancelText}>Cancel & return Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={goHome}>
            <Text style={styles.secondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

// helper
async function safeJson(resp) {
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  h1: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  p: { color: "#444", marginBottom: 18 },
  filename: { color: "#666", marginBottom: 10, fontStyle: "italic" },
  btn: {
    backgroundColor: "#0A1F44",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  loadingBox: {
    marginTop: 10,
    alignItems: "center",
  },
  cancelBtn: {
    marginTop: 16,
    padding: 10,
  },
  cancelText: {
    color: "red",
    fontWeight: "700",
  },

  secondaryBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0A1F44",
  },
  secondaryText: {
    color: "#0A1F44",
    fontWeight: "700",
  },
});
