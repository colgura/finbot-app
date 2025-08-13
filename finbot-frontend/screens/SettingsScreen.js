import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [language, setLanguage] = useState("English");

  // ✅ Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("preferredLanguage");
        if (savedLang) setLanguage(savedLang === "shona" ? "Shona" : "English");
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  // ✅ Toggle and persist language
  const toggleLanguage = async () => {
    try {
      const newLang = language === "English" ? "Shona" : "English";
      setLanguage(newLang);
      await AsyncStorage.setItem(
        "preferredLanguage",
        newLang.toLowerCase() // store as "english" or "shona"
      );
      Alert.alert("Language Updated", `Language changed to ${newLang}`);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>👤 Profile</Text>

      <TouchableOpacity
        style={styles.item}
        onPress={() => Alert.alert("Edit Profile")}
      >
        <Ionicons name="person-outline" size={20} />
        <Text style={styles.itemText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => Alert.alert("Change Password")}
      >
        <Ionicons name="lock-closed-outline" size={20} />
        <Text style={styles.itemText}>Change Password</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>⚙️ Preferences</Text>

      <TouchableOpacity style={styles.item}>
        <Ionicons name="notifications-outline" size={20} />
        <Text style={styles.itemText}>Notification Preferences</Text>
      </TouchableOpacity>

      <View style={styles.item}>
        <Ionicons name="moon-outline" size={20} />
        <Text style={styles.itemText}>Dark Theme</Text>
        <Switch value={isDarkTheme} onValueChange={toggleTheme} />
      </View>

      <View style={styles.item}>
        <Ionicons name="language-outline" size={20} />
        <Text style={styles.itemText}>Language: {language}</Text>
        <TouchableOpacity onPress={toggleLanguage}>
          <Text style={{ color: "#007bff", marginLeft: 10 }}>Switch</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>📄 Others</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("About")}
      >
        <Ionicons name="information-circle-outline" size={20} color="#fff" />
        <Text style={styles.itemText}>About FinBot</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => Alert.alert("Terms & Conditions")}
      >
        <Ionicons name="document-text-outline" size={20} />
        <Text style={styles.itemText}>Terms & Conditions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => Alert.alert("Feedback form")}
      >
        <Ionicons name="chatbox-ellipses-outline" size={20} />
        <Text style={styles.itemText}>Feedback</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
    justifyContent: "space-between",
  },
  itemText: { fontSize: 16, marginLeft: 10, flex: 1 },
});
