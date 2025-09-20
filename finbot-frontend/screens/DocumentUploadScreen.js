// screens/DocumentUploadScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../src/context/AuthContext";

const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export default function DocumentUploadScreen() {
  const nav = useNavigation();
  const { token } = useAuth();

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");

  const pickPdf = async () => {
    setSummary("");
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const f = res.assets?.[0];
    if (!f) return;
    setFile(f); // { name, size, uri, mimeType }
  };

  const summarize = async () => {
    if (!file) {
      Alert.alert("No file", "Please choose a PDF first.");
      return;
    }
    setBusy(true);
    setSummary("");
    try {
      const form = new FormData();
      form.append("file", {
        uri: file.uri,
        name: file.name || "report.pdf",
        type: file.mimeType || "application/pdf",
      });

      const res = await fetch(`${API_BASE}/reports/summarize`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Summarize failed (${res.status}): ${text}`);
      }
      const data = await res.json(); // { ok, filename, summary }
      setSummary(data.summary || "");
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not summarize this PDF.");
    } finally {
      setBusy(false);
    }
  };

  const askFollowUpInChat = () => {
    if (!summary) {
      Alert.alert("No summary yet", "Summarize the PDF first.");
      return;
    }
    nav.navigate("Chat", {
      initialQuery:
        `Here is a summary of a financial report:\n\n${summary}\n\n` +
        `Based on this, what are the key risks and opportunities for a novice retail investor?`,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Report</Text>

      <TouchableOpacity style={styles.btn} onPress={pickPdf}>
        <Text style={styles.btnText}>Choose PDF</Text>
      </TouchableOpacity>

      {file && (
        <View style={styles.card}>
          <Text style={styles.meta}>Name: {file.name}</Text>
          {typeof file.size === "number" ? (
            <Text style={styles.meta}>
              Size: {(file.size / 1024).toFixed(1)} KB
            </Text>
          ) : null}
          <Text style={[styles.meta, { fontStyle: "italic" }]}>
            Ready to summarize
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, !file && { opacity: 0.5 }]}
        onPress={summarize}
        disabled={!file || busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Summarize</Text>
        )}
      </TouchableOpacity>

      {!!summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>{summary}</Text>
          <TouchableOpacity
            style={[styles.btn, { marginTop: 12 }]}
            onPress={askFollowUpInChat}
          >
            <Text style={styles.btnText}>Ask a follow-up in Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.hint}>
        Tip: On an emulator, drag a PDF onto the emulator and choose “File” so
        it appears in Downloads.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  btn: {
    backgroundColor: "#0A1F44",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fafafa",
    marginBottom: 14,
  },
  meta: { color: "#333", marginBottom: 4 },
  summaryBox: {
    marginTop: 10,
    backgroundColor: "#f7fbff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e3eefc",
    padding: 12,
  },
  summaryTitle: { fontWeight: "700", marginBottom: 6, color: "#0A1F44" },
  summaryText: { color: "#222", lineHeight: 20 },
  hint: { marginTop: 12, color: "#666", fontSize: 12 },
});
