import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import SettingsScreen from "../screens/SettingsScreen";
import DocumentUploadScreen from "../screens/DocumentUploadScreen";
import LearnScreen from "../screens/LearnScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import GlossaryScreen from "../screens/GlossaryScreen";
import SimulationScreen from "../screens/SimulationScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import AboutScreen from "../screens/AboutScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding">
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ navigation }) => ({
          title: "FinBot",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 15, marginRight: 10 }}>
              <TouchableOpacity onPress={() => console.log("Search pressed")}>
                <Ionicons name="search" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => console.log("Mic pressed")}>
                <Ionicons name="mic" size={22} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Upload")}>
                <Ionicons name="cloud-upload-outline" size={22} color="#000" />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Simulation"
        component={SimulationScreen}
        options={{ title: "Investor Simulation" }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Upload" component={DocumentUploadScreen} />
      <Stack.Screen name="Learn" component={LearnScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen name="Glossary" component={GlossaryScreen} />      
      <Stack.Screen name="AboutScreen" component={AboutScreen} />
    </Stack.Navigator>
  );
}
