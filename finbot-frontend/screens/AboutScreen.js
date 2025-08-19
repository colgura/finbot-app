import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <Image
        source={require("../assets/FinBotLogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.title}>About FinBot</Text>

      {/* Motivation */}
      <Text style={styles.sectionHeader}>Why FinBot?</Text>
      <Text style={styles.description}>
        Retail investors often lack access to professional-grade financial
        advice, especially in emerging markets where such services are costly or
        inaccessible. FinBot leverages AI to democratize financial intelligence
        by providing an affordable, multilingual, and conversational platform.
        The inclusion of Shona and English ensures cultural and linguistic
        relevance for Southern African investors, empowering users to interpret
        financial data, company reports, and market trends with confidence.
      </Text>

      {/* Mission Statement */}
      <Text style={styles.sectionHeader}>Our Mission</Text>
      <Text style={styles.description}>
        To make financial literacy and investment insights accessible to
        everyone through intelligent, localized, and easy-to-use AI technology.
      </Text>

      {/* Disclaimer */}
      <Text style={styles.disclaimerTitle}>Disclaimer</Text>
      <Text style={styles.disclaimer}>
        FinBot is an AI-powered application designed for educational and
        informational purposes only. It does not provide personalized financial
        advice. Always conduct your own research or consult a licensed financial
        advisor before making investment decisions.
      </Text>

      {/* Back to Landing */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Onboarding")}
      >
        <Text style={styles.buttonText}>Update My Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#0A1F44", // Navy-blue
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 20,
    color: "#FFD700", // Gold accent
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 15,
  },
  description: {
    color: "#f0f0f0",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  disclaimerTitle: {
    fontSize: 18,
    color: "#FFD700",
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
  },
  disclaimer: {
    color: "#f8f8f8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#1E90FF",
    padding: 15,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
