import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ChatBubble({ message, sender = "bot" }) {
  return (
    <View style={[styles.bubble, sender === "user" ? styles.user : styles.bot]}>
      <Text>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    maxWidth: "80%",
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7dd",
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e3e5",
  },
});
