// screens/OnboardingScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
  Alert, // ✅ needed
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSizes, fontWeights } from "../styles/theme";

const goals = ["Grow Wealth", "Learn Basics", "Save for Retirement"];
const risks = ["Low", "Moderate", "High"];
const interests = ["Stocks", "ETFs", "Crypto", "General"];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(null);
  const [risk, setRisk] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const toggleInterest = (item) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleContinue = async () => {
    if (!name || !goal || !risk || selectedInterests.length === 0) {
      Alert.alert(
        "Missing Info",
        "Please complete all sections including your name."
      );
      return;
    }
    const profile = { name, goal, risk, interests: selectedInterests };
    await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
    console.log("✅ Profile saved:", profile);
    navigation.replace("Home");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled" // ✅ lets button receive taps
        >
          <Text style={styles.title}>👋 Hi! I’m FinBot</Text>
          <Text style={styles.subtitle}>
            I’ll help you learn about investing. First, a few questions…
          </Text>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          {/* Goal */}
          <Text style={styles.label}>Investment Goal</Text>
          <View style={styles.optionsRow}>
            {goals.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGoal(g)}
                style={[styles.option, goal === g && styles.selected]}
              >
                <Text
                  style={goal === g ? styles.selectedText : styles.optionText}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Risk */}
          <Text style={styles.label}>Risk Preference</Text>
          <View style={styles.optionsRow}>
            {risks.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRisk(r)}
                style={[styles.option, risk === r && styles.selected]}
              >
                <Text
                  style={risk === r ? styles.selectedText : styles.optionText}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interests */}
          <Text style={styles.label}>Interests</Text>
          <View style={styles.optionsRow}>
            {interests.map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => toggleInterest(i)}
                style={[
                  styles.option,
                  selectedInterests.includes(i) && styles.selected,
                ]}
              >
                <Text
                  style={
                    selectedInterests.includes(i)
                      ? styles.selectedText
                      : styles.optionText
                  }
                >
                  {i}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#ccc", fontSize: 12, textAlign: "center" }}>
              Disclaimer: FinBot is for educational purposes only and does not
              provide financial advice.
            </Text>
          </View>

          {/* Continue */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!name || !goal || !risk || selectedInterests.length === 0) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleContinue}
            activeOpacity={0.9}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.continueText}>Continue to Dashboard</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#fff"
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  title: {
    fontSize: fontSizes.heading + 6,
    fontWeight: fontWeights.bold,
    marginBottom: 10,
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSizes.subheading,
    marginBottom: 25,
    color: colors.text,
  },
  label: {
    fontSize: fontSizes.label,
    marginBottom: 5,
    marginTop: 20,
    fontWeight: fontWeights.semiBold,
    color: colors.text,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e1e8f0",
    marginBottom: 10,
  },
  selected: { backgroundColor: colors.primary },
  optionText: { color: colors.text },
  selectedText: { color: "#fff", fontWeight: fontWeights.bold },
  continueButton: {
    marginTop: 30,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: fontSizes.subheading,
    fontWeight: fontWeights.bold,
  },
});
