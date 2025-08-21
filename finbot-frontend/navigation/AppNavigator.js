// navigation/AppNavigator.js
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "@expo/vector-icons/Ionicons";

// Screens
import AuthScreen from "../screens/AuthScreen";
import RegisterScreen from "../screens/RegisterScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import ChatScreen from "../screens/ChatScreen";
import SettingsScreen from "../screens/SettingsScreen";
import DocumentUploadScreen from "../screens/DocumentUploadScreen";
import LearnScreen from "../screens/LearnScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import GlossaryScreen from "../screens/GlossaryScreen";
import SimulationScreen from "../screens/SimulationScreen";
import AboutScreen from "../screens/AboutScreen";

const AuthStackNav = createNativeStackNavigator();
const AppStackNav = createNativeStackNavigator();

function AuthStack() {
  return (
    <AuthStackNav.Navigator initialRouteName="Auth">
      <AuthStackNav.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <AuthStackNav.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Create your account" }}
      />
    </AuthStackNav.Navigator>
  );
}

function AppStack() {
  return (
    <AppStackNav.Navigator>
      {/* Optional: if you want onboarding right after sign-up */}
      <AppStackNav.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <AppStackNav.Screen name="Home" component={HomeScreen} />
      <AppStackNav.Screen
        name="Chat"
        component={ChatScreen}
        options={({ navigation }) => ({
          title: "FinBot",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 15, marginRight: 10 }}>
              <Ionicons name="search" size={22} color="#000" />
              <Ionicons name="mic" size={22} color="#000" />
              <Ionicons
                name="cloud-upload-outline"
                size={22}
                color="#000"
                onPress={() => navigation.navigate("Upload")}
              />
            </View>
          ),
        })}
      />
      <AppStackNav.Screen
        name="Simulation"
        component={SimulationScreen}
        options={{ title: "Investor Simulation" }}
      />
      <AppStackNav.Screen name="Settings" component={SettingsScreen} />
      <AppStackNav.Screen name="About" component={AboutScreen} />
      <AppStackNav.Screen name="Upload" component={DocumentUploadScreen} />
      <AppStackNav.Screen name="Learn" component={LearnScreen} />
      <AppStackNav.Screen name="Portfolio" component={PortfolioScreen} />
      <AppStackNav.Screen name="Glossary" component={GlossaryScreen} />
    </AppStackNav.Navigator>
  );
}

export default function AppNavigator() {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        setIsAuthed(!!token);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isAuthed ? <AppStack /> : <AuthStack />;
}
