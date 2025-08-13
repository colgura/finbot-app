import React, { useState, useEffect, useRef } from "react";
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
import { EventSourcePolyfill } from "event-source-polyfill"; // ✅ Polyfill for SSE
import ChatBubble from "../components/ChatBubble";
import { colors, fontSizes } from "../styles/theme";

export default function ChatScreen() {
  const [language, setLanguage] = useState("english");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi! Ask me about any stock (e.g., ‘Is NVDA overvalued?’)",
    },
  ]);

  const scrollRef = useRef(null);
  const navigation = useNavigation();

  // ✅ Load preferred language
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem("preferredLanguage");
      if (savedLang) setLanguage(savedLang);
    };
    loadLanguage();
  }, []);

  // ✅ Send message with SSE using polyfill
  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    let partialText = "";

    const es = new EventSourcePolyfill(
      `http://10.0.2.2:5000/ask?question=${encodeURIComponent(
        input
      )}&language=${language}`
    );

    es.addEventListener("open", () => {
      console.log("✅ SSE connection opened");
    });

    es.addEventListener("message", (event) => {
      if (event.data === "[DONE]") {
        es.close();
        setMessages((prev) => [
          ...prev.filter((m) => m.type !== "bot-temp"),
          { type: "bot", text: partialText },
        ]);
      } else {
        partialText += event.data;
        setMessages((prev) => [
          ...prev.filter((m) => m.type !== "bot-temp"),
          { type: "bot-temp", text: partialText },
        ]);
      }
    });

    es.addEventListener("error", (err) => {
      console.error("❌ SSE error:", err);
      es.close();
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "⚠️ Could not fetch response from server." },
      ]);
    });

    setInput("");
  };


  const handleSuggestion = (suggestion) => setInput(suggestion);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Advisor Chat</Text>
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
        <ScrollView
          style={styles.chatArea}
          ref={scrollRef}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
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
          {[
            "Is NVDA overvalued?",
            "What’s the difference between stocks and bonds?",
            "Explain risk tolerance",
          ].map((suggestion, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSuggestion(suggestion)}
              style={styles.suggestionButton}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about stocks..."
            style={styles.input}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.button}>
            <Text style={styles.buttonText}>Send</Text>
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
