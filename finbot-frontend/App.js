import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppNavigator from "./navigation/AppNavigator";
import OnboardingScreen from "./screens/OnboardingScreen";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem("userProfile");
      setShowOnboarding(!seen);
    };
    checkOnboarding();
  }, []);

  if (showOnboarding === null) return null; // wait for AsyncStorage

  const finishOnboarding = () => setShowOnboarding(false);

  return (
    <NavigationContainer>
      {showOnboarding ? (
        <OnboardingScreen onFinish={finishOnboarding} />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}
