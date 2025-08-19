// screens/SimulationScreen.js
import React, { useState, useEffect, useRef } from "react";
import { api } from "../src/api/client";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fontSizes } from "../styles/theme";

const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export default function SimulationScreen() {
  // --- boot/profile state ---
  const [booting, setBooting] = useState(true); // loading profile from storage
  const [showWelcome, setShowWelcome] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [userId, setUserId] = useState(null); // <- drives portfolio load

  // --- trading state ---
  const [loading, setLoading] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [portfolio, setPortfolio] = useState({});
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState("BUY");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [price, setPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const debounceRef = useRef(null);

  // --- boot: load profile from AsyncStorage, decide welcome vs trading ---
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("userProfile");
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.userId) {
            setUserId(Number(p.userId));
            setProfileName(p?.name || "");
            setShowWelcome(false);
          } else if (p?.name) {
            setProfileName(p.name);
            setShowWelcome(true);
          } else {
            setShowWelcome(true);
          }
        } else {
          setShowWelcome(true);
        }
      } catch {
        setShowWelcome(true);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // --- load portfolio when we have a userId ---
  useEffect(() => {
    if (userId == null) return;
    fetchPortfolio(userId);
  }, [userId]);

  // --- debounce price lookups ---
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const sym = symbol.trim().toUpperCase();
    if (!sym) {
      setPrice(null);
      return;
    }
    debounceRef.current = setTimeout(() => fetchPrice(sym), 400);
  }, [symbol]);

  // ===== Welcome flow =====
  const handleCreateOrLoad = async () => {
    const clean = profileName.trim();
    if (!clean || isSubmittingProfile) return;

    setIsSubmittingProfile(true);
    setMessage("Saving profile...");
    try {
      const resp = await fetch(`${BASE_URL}/users/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clean,
          goal: "Grow Wealth",
          risk: "Low",
          interests: ["Stocks"],
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data?.error) {
        setMessage(`❌ ${data?.error || `HTTP ${resp.status}`}`);
        return;
      }
      console.log("✅ Profile saved:", data.profile);
      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify({
          userId: data.userId,
          name: clean,
          goal: "Grow Wealth",
          risk: "Low",
          interests: ["Stocks"],
        })
      );
      setUserId(Number(data.userId));
      setShowWelcome(false);
      setMessage("✅ Profile saved");
    } catch (e) {
      console.error("Profile save failed:", e);
      setMessage("❌ Failed to save profile");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // ===== API calls =====
  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const data = await api(`/simulation/portfolio/${userId}`);
      setCashBalance(parseFloat(data.cash_balance || 0));
      setPortfolio(data.portfolio || {});
      if (Array.isArray(data.history)) setHistory(data.history);
    } catch (error) {
      console.error("❌ Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrice = async (symbolInput) => {
    setPriceLoading(true);
    try {
      const data = await api(
        `/simulation/price?symbol=${encodeURIComponent(symbolInput)}`
      );
      const p = typeof data.price === "number" ? data.price : null;
      setPrice(p);
    } catch (error) {
      setPrice(null);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!symbol.trim() || !quantity) {
      setMessage("Please enter symbol and quantity.");
      return;
    }
    setMessage("Processing...");
    try {
      const data = await api("/simulation/order", {
        method: "POST",
        body: {
          userId,
          action,
          symbol: symbol.trim().toUpperCase(),
          quantity: parseInt(quantity, 10),
        },
      });

      setMessage(`✅ ${action} successful!`);
      setCashBalance(parseFloat(data.cash_balance || 0));
      setPortfolio(data.portfolio || {});
      if (Array.isArray(data.history)) setHistory(data.history); // trust server’s full history
      setQuantity(""); // clear only once; keep symbol for quick re-trades
    } catch (error) {
      console.error("❌ Order error:", error);
      setMessage(`❌ ${error.message || "Failed to place order."}`);
    }
  };

  // ===== Render =====
  if (booting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading…</Text>
      </View>
    );
  }

  if (showWelcome) {
    return (
      <KeyboardAvoidingView
        style={styles.welcomeWrap}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.sectionTitle}>Welcome to FinBot</Text>
          <Text style={styles.welcomeText}>
            Enter your name to create your simulated account or sign back in.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Your name (e.g., Collen)"
            value={profileName}
            onChangeText={setProfileName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleCreateOrLoad}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!profileName.trim() || isSubmittingProfile) && { opacity: 0.7 },
            ]}
            onPress={handleCreateOrLoad}
            disabled={!profileName.trim() || isSubmittingProfile}
          >
            <Text style={styles.submitText}>
              {isSubmittingProfile ? "Saving..." : "Continue"}
            </Text>
          </TouchableOpacity>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Trading UI
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading Portfolio...</Text>
      </View>
    );
  }

  const renderHistoryItem = ({ item }) => (
    <Text style={styles.historyItem}>
      {item.action} {item.symbol} x{item.quantity}
    </Text>
  );

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={renderHistoryItem}
      ListEmptyComponent={
        <Text style={{ paddingHorizontal: 15 }}>No transactions yet.</Text>
      }
      ListHeaderComponent={
        <View>
          {/* Portfolio Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio Overview</Text>
            <Text style={styles.balanceText}>
              Cash Balance: ${cashBalance.toFixed(2)}
            </Text>
            {Object.keys(portfolio).length === 0 ? (
              <Text>No holdings yet.</Text>
            ) : (
              Object.entries(portfolio).map(([sym, qty]) => (
                <View key={sym} style={styles.tableRow}>
                  <Text style={styles.tableCol}>{sym}</Text>
                  <Text style={styles.tableCol}>{qty}</Text>
                </View>
              ))
            )}
          </View>

          {/* Place an Order */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Place an Order</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter symbol (e.g., AAPL)"
              autoCapitalize="characters"
              value={symbol}
              onChangeText={(t) => setSymbol(t.toUpperCase())}
            />

            {priceLoading ? (
              <Text style={styles.priceInfo}>Checking price...</Text>
            ) : price !== null ? (
              <Text style={styles.priceInfo}>
                Current Price: ${price.toFixed(2)}
              </Text>
            ) : (
              symbol.trim() !== "" && (
                <Text style={styles.priceInfo}>❌ Price not found.</Text>
              )
            )}

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ""))}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  action === "BUY" && styles.selected,
                ]}
                onPress={() => setAction("BUY")}
              >
                <Text style={styles.actionText}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  action === "SELL" && styles.selected,
                ]}
                onPress={() => setAction("SELL")}
              >
                <Text style={styles.actionText}>SELL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleOrder}>
              <Text style={styles.submitText}>Submit Order</Text>
            </TouchableOpacity>

            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>

          {/* History title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
        </View>
      }
      contentContainerStyle={{ padding: 15, backgroundColor: "#f9f9f9" }}
      initialNumToRender={10}
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  // Welcome
  welcomeWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  welcomeCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeText: { color: "#555", marginBottom: 12 },

  // Shared
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.primary,
  },
  balanceText: {
    fontSize: fontSizes.subheading,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  tableCol: {
    fontSize: fontSizes.label,
  },
  input: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  selected: {
    backgroundColor: colors.primary,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: fontSizes.subheading,
  },
  message: {
    marginTop: 10,
    color: colors.primary,
    fontWeight: "bold",
  },
  historyItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  priceInfo: {
    marginBottom: 8,
    fontSize: 14,
    color: "#333",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
