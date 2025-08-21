// screens/ProfileScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("userProfile");
      setProfile(raw ? JSON.parse(raw) : null);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.row}>Name: {profile?.name || "-"}</Text>
      <Text style={styles.row}>Email: {profile?.email || "-"}</Text>
      <Text style={[styles.hint, { marginTop: 12 }]}>
        (Wire editing later or link to Settings for password change.)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  row: {
    fontSize: 16,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: "#666",
  },
});
