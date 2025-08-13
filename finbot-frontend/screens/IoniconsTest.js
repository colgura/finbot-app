// screens/IoniconsTest.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function IoniconsTest() {
  return (
    <View style={styles.container}>
      <Text>Testing Ionicons:</Text>
      <Ionicons name="search-outline" size={48} color="blue" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
