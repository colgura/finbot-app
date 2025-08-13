import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function StockCard({
  symbol,
  name,
  price,
  change,
  pe,
  rsi,
  summary,
  buttons = [],
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>
        {symbol} ({name})
      </Text>
      <Text style={styles.line}>
        📈 Price: ${price} ({change})
      </Text>
      <Text style={styles.line}>
        🧮 P/E: {pe.value} (Industry avg: {pe.industry})
      </Text>
      <Text style={styles.line}>
        📊 RSI: {rsi.value} ({rsi.status})
      </Text>
      <Text style={styles.summary}>💡 {summary}</Text>
      <View style={styles.buttonRow}>
        {buttons.map((btn, i) => (
          <TouchableOpacity key={i} onPress={btn.onPress} style={styles.button}>
            <Text style={styles.buttonText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eef5ff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  header: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  line: {
    fontSize: 14,
    marginBottom: 2,
  },
  summary: {
    fontStyle: "italic",
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 6,
    marginTop: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 13,
  },
});
