// screens/InvestorSimulationScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors, fontSizes, fontWeights } from "../styles/theme";

const caseStudies = [
  {
    stock: "Tesla (TSLA)",
    buyDate: "2025-06-01",
    buyPrice: 182.56,
    sellDate: "2025-06-08",
    sellPrice: 195.34,
    brokerageFee: 1.5,
    scenario:
      "Bought during a period of strong earnings and dividend announcement.",
  },
  {
    stock: "Apple (AAPL)",
    buyDate: "2025-05-15",
    buyPrice: 170.23,
    sellDate: "2025-05-22",
    sellPrice: 176.8,
    brokerageFee: 1.5,
    scenario: "Bought before WWDC event, sold after positive iPhone news.",
  },
  {
    stock: "Nvidia (NVDA)",
    buyDate: "2025-04-10",
    buyPrice: 912.45,
    sellDate: "2025-04-17",
    sellPrice: 935.67,
    brokerageFee: 1.5,
    scenario: "Bought during AI boom, sold after analyst upgrade.",
  },
];

export default function InvestorSimulationScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCase = caseStudies[selectedIndex];
  const navigation = useNavigation();

  const buyFee = selectedCase.buyPrice * (selectedCase.brokerageFee / 100);
  const sellFee = selectedCase.sellPrice * (selectedCase.brokerageFee / 100);
  const netBuy = selectedCase.buyPrice + buyFee;
  const netSell = selectedCase.sellPrice - sellFee;
  const profit = netSell - netBuy;
  const profitPercentage = (profit / netBuy) * 100;
  const isProfit = profit >= 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Investor Simulation</Text>

      <Text style={styles.label}>📊 Choose a Case Study</Text>
      <View style={styles.picker}>
        <Picker
          selectedValue={selectedIndex}
          onValueChange={(value) => setSelectedIndex(value)}
        >
          {caseStudies.map((item, index) => (
            <Picker.Item key={index} label={item.stock} value={index} />
          ))}
        </Picker>
      </View>

      {/* FinBot Narrative Message */}
      <View style={styles.narrativeBox}>
        <Text style={styles.label}>🤖 FinBot Says</Text>
        <Text style={styles.textStrong}>
          You bought {selectedCase.stock} at ${selectedCase.buyPrice}. The
          brokerage charged a {selectedCase.brokerageFee}% fee, so you paid $
          {netBuy.toFixed(2)} in total. After a week, you sold at $
          {selectedCase.sellPrice}, minus a {selectedCase.brokerageFee}% fee.{" "}
          Your net proceeds were ${netSell.toFixed(2)}. That’s a{" "}
          {isProfit ? "profit" : "loss"} of ${profit.toFixed(2)} per share —
          about {profitPercentage.toFixed(2)}%.{" "}
          {isProfit ? "Well done!" : "Tough lesson, but valuable!"}
        </Text>
      </View>

      <View style={styles.resultBox}>
        <Text
          style={{
            color: colors.primary,
            fontSize: fontSizes.heading,
            fontWeight: fontWeights.bold,
            marginBottom: 10,
          }}
        >
          Simulation Summary
        </Text>
        <Text style={styles.textStrong}>
          Bought {selectedCase.stock} at ${selectedCase.buyPrice}
        </Text>
        <Text style={styles.textStrong}>
          Brokerage Fee (Buy): ${buyFee.toFixed(2)}
        </Text>
        <Text style={styles.textStrong}>Sold at ${selectedCase.sellPrice}</Text>
        <Text style={styles.textStrong}>
          Brokerage Fee (Sell): ${sellFee.toFixed(2)}
        </Text>
        <Text
          style={[
            styles.textStrong,
            { color: isProfit ? "green" : "red", fontWeight: "bold" },
          ]}
        >
          {isProfit ? "Profit" : "Loss"}: ${profit.toFixed(2)} (
          {profitPercentage.toFixed(2)}%)
        </Text>
      </View>

      <View style={styles.scenarioBox}>
        <Text style={styles.label}>📘 Scenario</Text>
        <Text style={styles.textStrong}>{selectedCase.scenario}</Text>
      </View>

      <TouchableOpacity
        style={styles.askBotButton}
        onPress={() =>
          navigation.navigate("Chat", {
            initialQuery: `Can you explain this investment case with ${selectedCase.stock}?`,
          })
        }
      >
        <Ionicons
          name="chatbox-ellipses-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.askBotText}>Ask FinBot a question about this</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafd",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  resultBox: {
    backgroundColor: "#eef6f9",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  textStrong: {
    fontSize: 15,
    color: "#222",
    marginBottom: 6,
  },
  scenarioBox: {
    backgroundColor: "#fff7eb",
    borderLeftWidth: 4,
    borderLeftColor: "#ffa500",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  askBotButton: {
    flexDirection: "row",
    backgroundColor: "#0A1F44",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  askBotText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  narrativeBox: {
    backgroundColor: "#e6f4ea",
    borderLeftWidth: 4,
    borderLeftColor: "#34c759",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
});
