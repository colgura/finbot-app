// screens/HomeScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  BackHandler,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";


export default function HomeScreen() {
  const navigation = useNavigation();
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  // when rendering
  const displayName = userName || "Investor";  

  // 1) Load saved name from AsyncStorage once on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("userProfile");
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.name) setUserName(p.name);
        }
      } catch {}
    })();
  }, []);

  // 2) Recompute the greeting whenever userName changes
  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good Morning";
    else if (hour < 18) timeGreeting = "Good Afternoon";
    else timeGreeting = "Good Evening";
    setGreeting(`${timeGreeting}, ${userName}`);
  }, [userName]);

  const glossaryTips = [
    {
      term: "Dividend",
      definition:
        "A portion of a company’s earnings distributed to shareholders.",
    },
    {
      term: "ETF",
      definition:
        "Exchange-Traded Fund — a basket of securities traded like a stock.",
    },
    {
      term: "Risk Tolerance",
      definition: "Your ability to endure losses in your investment journey.",
    },
    {
      term: "P/E Ratio",
      definition:
        "Price-to-Earnings ratio — indicates whether a stock is over/undervalued.",
    },
  ];

  const randomTip =
    glossaryTips[Math.floor(Math.random() * glossaryTips.length)];

  const goToOnboarding = async () => {
    await AsyncStorage.removeItem("userProfile");
    navigation.replace("Onboarding");
  };

  const exitApp = () => {
    if (Platform.OS === "android") {
      BackHandler.exitApp();
    } else {
      Alert.alert("Exit", "This function is only available on Android.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Greeting */}
      <Text style={styles.heading}>🤖 Welcome to FinBot</Text>
      <Text style={styles.subtext}>Your AI-powered financial assistant</Text>
      <Text style={styles.greeting}>👋 {greeting}</Text>

      {/* Investor Simulation Highlight */}
      <TouchableOpacity
        style={styles.simulationCard}
        onPress={() => navigation.navigate("Simulation")}
      >
        <Ionicons name="trending-up" size={36} color="#fff" />
        <View style={{ marginLeft: 15, flex: 1 }}>
          <Text style={styles.simTitle}>Investor Simulation</Text>
          <Text style={styles.simSubtitle}>
            Practice trading with virtual funds in real-time or historical mode.
          </Text>
        </View>
      </TouchableOpacity>

      {/* Glossary Tip */}
      <View style={styles.highlightCard}>
        <Text style={styles.highlightHeading}>📘 Glossary Term of the Day</Text>
        <Text style={styles.highlightTerm}>{randomTip.term}</Text>
        <Text style={styles.highlightDefinition}>{randomTip.definition}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Glossary")}>
          <Text style={styles.linkText}>Explore Glossary →</Text>
        </TouchableOpacity>
      </View>

      {/* Start Chat */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Chat")}
      >
        <Text style={styles.buttonText}>Start Chat</Text>
      </TouchableOpacity>

      {/* Settings */}
      <TouchableOpacity
        style={[styles.button, { flexDirection: "row", alignItems: "center" }]}
        onPress={() => navigation.navigate("Settings")}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>

      {/* Learning Hub */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Learn")}
      >
        <Text style={styles.buttonText}>Explore Learning Hub</Text>
      </TouchableOpacity>

      {/* Portfolio */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Portfolio")}
      >
        <Text style={styles.buttonText}>Build My First Portfolio</Text>
      </TouchableOpacity>

      {/* Reset & Exit */}
      <TouchableOpacity onPress={goToOnboarding} style={{ marginTop: 30 }}>
        <Text style={{ color: "#0A1F44", textAlign: "center" }}>
          Reset Onboarding
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={exitApp} style={{ marginTop: 15 }}>
        <Text style={{ color: "red", textAlign: "center" }}>Exit App</Text>
      </TouchableOpacity>

      {/* Tip of the Day */}
      <View style={styles.highlightsBox}>
        <Text style={styles.highlightTitle}>🌟 Tip of the Day</Text>
        <Text style={styles.highlightText}>
          Diversify your portfolio to reduce risk. Ask FinBot to explain how!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    marginBottom: 30,
    color: "#555",
  },
  greeting: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 20,
    color: "#333",
  },

  /* Simulation Highlight Card */
  simulationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1F44",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  simTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  simSubtitle: {
    fontSize: 14,
    color: "#eee",
  },

  button: {
    backgroundColor: "#0A1F44",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  /* Glossary Tip */
  highlightCard: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  highlightHeading: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#0A1F44",
  },
  highlightTerm: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  highlightDefinition: {
    fontSize: 14,
    color: "#555",
    marginVertical: 6,
  },
  linkText: {
    color: "#0A1F44",
    fontWeight: "600",
    marginTop: 4,
  },

  highlightsBox: {
    backgroundColor: "#e6f4ff",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  highlightTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 14,
    color: "#333",
  },
});
