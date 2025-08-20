// App.js
import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LearnScreen from "./screens/LearnScreen";

import I18nProvider from "./src/context/i18nContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { colors } from "./styles/theme";

// ⬇️ Update these paths if your files live elsewhere
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import PortfolioScreen from "./screens/PortfolioScreen";
import SimulationScreen from "./screens/SimulationScreen"; // if you named it differently, fix the import
import ChatScreen from "./screens/ChatScreen"; // optional: only if you have it
import SettingsScreen from "./screens/SettingsScreen"; // optional: only if you have it

const Stack = createNativeStackNavigator();

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 8, color: "#9BB0C5" }}>Starting…</Text>
    </View>
  );
}

function Routes() {
  const { booting, token, hasOnboarded } = useAuth();

  if (booting) return <Loading />;

  // 1) First run: show onboarding + auth
  if (!hasOnboarded) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  // 2) Onboarded but not signed in: auth-only stack
  if (!token) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  // 3) Signed in: main app
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "FinBot" }}
      />
      <Stack.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ title: "Portfolio" }}
      />
      <Stack.Screen
        name="Simulation"
        component={SimulationScreen}
        options={{ title: "Investor Simulation" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: "Ask FinBot" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      {/* ⬇️ Restore Learn here */}
      <Stack.Screen
        name="Learn"
        component={LearnScreen}
        options={{ title: "Learn" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </I18nProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
});
