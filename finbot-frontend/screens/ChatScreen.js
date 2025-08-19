// screens/ChatScreen.js
import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../src/api/client";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { EventSourcePolyfill } from "event-source-polyfill";
import ChatBubble from "../components/ChatBubble";
import { colors, fontSizes } from "../styles/theme";
import { useI18n } from "../src/context/i18nContext";

export default function ChatScreen() {
  const navigation = useNavigation();
  const { lang } = useI18n(); // "english" | "shona"
  const scrollRef = useRef(null);
  const esRef = useRef(null);
  const streamIndexRef = useRef(-1); // track the temp streaming bubble index

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text:
        lang === "shona"
          ? "Mhoro! Bvunza nezve chero stock (semuenzaniso: ‘NVDA yakanyanyisa kudhura here?’)"
          : "Hi! Ask me about any stock (e.g., ‘Is NVDA overvalued?’)",
    },
  ]);

  // ensure greeting tracks language change live
  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const first = prev[0];
      if (first.type !== "bot") return prev;
      const updated = {
        ...first,
        text:
          lang === "shona"
            ? "Mhoro! Bvunza nezve chero stock (semuenzaniso: ‘NVDA yakanyanyisa kudhura here?’)"
            : "Hi! Ask me about any stock (e.g., ‘Is NVDA overvalued?’)",
      };
      return [updated, ...prev.slice(1)];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // auto-scroll to bottom on new content
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // tidy up any open SSE when leaving screen
  useEffect(() => {
    return () => {
      try {
        esRef.current?.close();
      } catch {}
    };
  }, []);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q) return;

    // push user message
    setMessages((prev) => [...prev, { type: "user", text: q }]);
    setInput("");

    // prepare streaming bubble
    let partial = "";
    setMessages((prev) => {
      streamIndexRef.current = prev.length; // index of the new temp bubble
      return [...prev, { type: "bot-temp", text: "" }];
    });

    // optional auth header
    const token = await AsyncStorage.getItem("authToken");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    // open SSE to backend
    const url = `${API_BASE}/ask?question=${encodeURIComponent(
      q
    )}&language=${encodeURIComponent(lang)}`;

    const es = new EventSourcePolyfill(url, {
      headers,
      heartbeatTimeout: 45000,
    });
    esRef.current = es;

    es.addEventListener("open", () => {
      // console.log("SSE opened");
    });

    es.addEventListener("message", (event) => {
      if (event.data === "[DONE]") {
        es.close();
        esRef.current = null;
        // convert temp bubble to final bot bubble
        setMessages((prev) => {
          const i = streamIndexRef.current;
          if (i < 0 || i >= prev.length) return prev;
          const copy = [...prev];
          copy[i] = { type: "bot", text: partial || "(no content)" };
          streamIndexRef.current = -1;
          return copy;
        });
        return;
      }
      // accumulate streaming text
      partial += event.data;
      setMessages((prev) => {
        const i = streamIndexRef.current;
        if (i < 0 || i >= prev.length) return prev;
        const copy = [...prev];
        copy[i] = { type: "bot-temp", text: partial };
        return copy;
      });
    });

    es.addEventListener("error", (err) => {
      // console.error("SSE error:", err);
      try {
        es.close();
      } catch {}
      esRef.current = null;
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text:
            lang === "shona"
              ? "⚠️ Kanganiso yakaitika pakutora mhinduro kubva kuseva."
              : "⚠️ Could not fetch response from server.",
        },
      ]);
      streamIndexRef.current = -1;
    });
  };

  const suggestions =
    lang === "shona"
      ? [
          "NVDA yakanyanyisa kudhura here?",
          "Musiyano uripo pakati pe ‘stocks’ ne ‘bonds’ chii?",
          "Tsanangura ‘risk tolerance’",
        ]
      : [
          "Is NVDA overvalued?",
          "What’s the difference between stocks and bonds?",
          "Explain risk tolerance",
        ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {lang === "shona" ? "Stock Advisor Chat-Room" : "Stock Advisor Chat-Room"}
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate("Home")}>
            <Ionicons name="home-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <Ionicons name="search-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <Ionicons name="mic-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView style={styles.chatArea} ref={scrollRef}>
          {messages.map((msg, index) => (
            <ChatBubble
              key={index}
              message={msg.text}
              sender={msg.type === "bot-temp" ? "bot" : msg.type}
            />
          ))}
        </ScrollView>

        {/* Suggestions */}
        <View style={styles.suggestions}>
          {suggestions.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setInput(s)}
              style={styles.suggestionButton}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={
              lang === "shona"
                ? "Bvunza nezve masheya..."
                : "Ask about stocks..."
            }
            placeholderTextColor="#888"
            style={styles.input}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.button}>
            <Text style={styles.buttonText}>
              {lang === "shona" ? "Tumira" : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  header: {
    backgroundColor: colors.primary,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: fontSizes.heading,
    fontWeight: "bold",
  },
  headerIcons: { flexDirection: "row" },
  chatArea: { flex: 1, padding: 10 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginRight: 5,
    color: "#000",
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 6,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  suggestions: {
    flexDirection: "column",
    backgroundColor: "#eef7ff",
    padding: 10,
  },
  suggestionButton: { marginBottom: 5 },
  suggestionText: { color: "#333", textDecorationLine: "underline" },
});
