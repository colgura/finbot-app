// // screens/SimulationScreen.js
// import React, { useState, useEffect, useRef } from "react";
// import { api } from "../src/api/client";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   FlatList,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { colors, fontSizes } from "../styles/theme";

// const BASE_URL =
//   Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

// // --- helpers (put near the top of SimulationScreen.js) ---
// const formatTs = (ts) => {
//   if (!ts) return "-";

//   // If you ever pass a number, support both seconds and millis
//   if (typeof ts === "number") {
//     const ms = ts < 1e12 ? ts * 1000 : ts; // guess seconds vs millis
//     return new Intl.DateTimeFormat(undefined, {
//       dateStyle: "short",
//       timeStyle: "short",
//     }).format(new Date(ms));
//   }

//   // Strings like "2025-09-21T22:50:00.000Z" (UTC) or "2025-09-21 22:50:00"
//   const d = new Date(ts);
//   if (Number.isNaN(d.getTime())) return String(ts); // show raw if unparsable

//   return new Intl.DateTimeFormat(undefined, {
//     dateStyle: "short",
//     timeStyle: "short",
//   }).format(d);
// };

// export default function SimulationScreen() {
//   // --- boot/profile state ---
//   const [booting, setBooting] = useState(true);
//   const [showWelcome, setShowWelcome] = useState(false);
//   const [profileName, setProfileName] = useState("");
//   const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
//   const [userId, setUserId] = useState(null);

//   // --- trading state ---
//   const [loading, setLoading] = useState(false);
//   const [cashBalance, setCashBalance] = useState(0);
//   const [portfolio, setPortfolio] = useState({});
//   const [symbol, setSymbol] = useState("");
//   const [quantity, setQuantity] = useState("");
//   const [action, setAction] = useState("BUY");
//   const [message, setMessage] = useState("");
//   const [history, setHistory] = useState([]);
//   const [price, setPrice] = useState(null);
//   const [priceLoading, setPriceLoading] = useState(false);

//   const debounceRef = useRef(null);

//   // --------------- Boot: load profile from storage ---------------
//   useEffect(() => {
//     (async () => {
//       try {
//         const raw = await AsyncStorage.getItem("userProfile");
//         if (raw) {
//           const p = JSON.parse(raw);
//           if (p?.userId) {
//             setUserId(Number(p.userId));
//             setProfileName(p?.name || "");
//             setShowWelcome(false);
//           } else if (p?.name) {
//             setProfileName(p.name);
//             setShowWelcome(true);
//           } else {
//             setShowWelcome(true);
//           }
//         } else {
//           setShowWelcome(true);
//         }
//       } catch {
//         setShowWelcome(true);
//       } finally {
//         setBooting(false);
//       }
//     })();
//   }, []);

//   // --------------- Load portfolio when we have a userId ---------------
//   useEffect(() => {
//     if (userId == null) return;
//     fetchPortfolio(userId);
//   }, [userId]);

//   // --------------- Debounce price lookups ---------------
//   useEffect(() => {
//     if (debounceRef.current) clearTimeout(debounceRef.current);
//     const sym = symbol.trim().toUpperCase();
//     if (!sym) {
//       setPrice(null);
//       return;
//     }
//     debounceRef.current = setTimeout(() => fetchPrice(sym), 400);
//   }, [symbol]);

//   // --------------- Create/Load profile (welcome) ---------------
//   const handleCreateOrLoad = async () => {
//     const clean = profileName.trim();
//     if (!clean || isSubmittingProfile) return;

//     setIsSubmittingProfile(true);
//     setMessage("Saving profile...");
//     try {
//       const resp = await fetch(`${BASE_URL}/users/upsert`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           name: clean,
//           goal: "Grow Wealth",
//           risk: "Low",
//           interests: ["Stocks"],
//         }),
//       });
//       const data = await resp.json();
//       if (!resp.ok || data?.error) {
//         setMessage(`❌ ${data?.error || `HTTP ${resp.status}`}`);
//         return;
//       }

//       await AsyncStorage.setItem(
//         "userProfile",
//         JSON.stringify({
//           userId: data.userId,
//           name: clean,
//           goal: "Grow Wealth",
//           risk: "Low",
//           interests: ["Stocks"],
//         })
//       );
//       setUserId(Number(data.userId));
//       setShowWelcome(false);
//       setMessage("✅ Profile saved");

//       // Pull everything (including trades with timestamps)
//       await fetchPortfolio(Number(data.userId));
//     } catch (e) {
//       console.error("Profile save failed:", e);
//       setMessage("❌ Failed to save profile");
//     } finally {
//       setIsSubmittingProfile(false);
//     }
//   };

//   // --------------- API calls ---------------
//   const fetchPortfolio = async (uid = userId) => {
//     setLoading(true);
//     try {
//       // account + positions (whatever your backend returns)
//       const data = await api(`/simulation/portfolio/${uid}`);
//       setCashBalance(parseFloat(data.cash_balance || 0));
//       setPortfolio(data.portfolio || {});

//       // recent trades (ORDER BY ts DESC)
//       const t = await api(
//         `/trades/recent?limit=20${uid ? `&userId=${uid}` : ""}`
//       );
//       if (Array.isArray(t.trades)) {
//         // sanity log once to confirm ts is present
//         if (t.trades.length) console.log("recent trade sample:", t.trades[0]);
//         setHistory(t.trades);
//       }
//     } catch (error) {
//       console.error("❌ Error fetching portfolio:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPrice = async (symbolInput) => {
//     setPriceLoading(true);
//     try {
//       const data = await api(
//         `/simulation/price?symbol=${encodeURIComponent(symbolInput)}`
//       );
//       const p = typeof data.price === "number" ? data.price : null;
//       setPrice(p);
//     } catch (error) {
//       setPrice(null);
//     } finally {
//       setPriceLoading(false);
//     }
//   };

//   // --------------- Submit trade, then refresh ---------------
//   const submitTrade = async () => {
//     // ⬇️ the two lines you asked about — kept exactly
//     const sym = symbol.trim().toUpperCase();
//     const qty = Number.parseInt(quantity, 10);

//     if (!userId) {
//       setMessage("Please create a profile first.");
//       return;
//     }
//     if (!sym) {
//       setMessage("Enter a ticker (e.g., NVDA).");
//       return;
//     }
//     if (!Number.isFinite(qty) || qty <= 0) {
//       setMessage("Enter a valid quantity.");
//       return;
//     }

//     setLoading(true);
//     setMessage("Placing order…");

//     try {
//       const resp = await fetch(`${BASE_URL}/simulation/trade`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userId,
//           action, // "BUY" or "SELL"
//           symbol: sym,
//           quantity: qty,
//           ...(typeof price === "number" ? { price } : {}),
//         }),
//       });

//       const data = await resp.json();
//       if (!resp.ok || data?.error) {
//         setMessage(`❌ ${data?.error || `HTTP ${resp.status}`}`);
//         return;
//       }

//       setMessage(`✅ ${action} ${sym} × ${qty} placed`);

//       // Single refresh that updates cash, positions, and trades (with DB timestamps)
//       await fetchPortfolio(userId);

//       // clear form
//       setSymbol("");
//       setQuantity("");
//     } catch (e) {
//       console.error("submitTrade error:", e);
//       setMessage("❌ Trade failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // --------------- Renderers ---------------
//   const renderPosition = ([sym, pos]) => (
//     <View style={styles.posRow} key={sym}>
//       <Text style={styles.posSymbol}>{sym}</Text>
//       <Text style={styles.posQty}>qty: {pos.qty}</Text>
//       <Text style={styles.posCost}>avg: {Number(pos.avg_cost).toFixed(2)}</Text>
//     </View>
//   );

//   const renderTrade = ({ item }) => {
//     // your API returns "ts" — use it; fallbacks included just in case
//     const when = item.ts || item.timestamp || item.created_at;
//     return (
//       <View style={styles.tradeRow}>
//         <View style={{ flex: 1 }}>
//           <Text style={styles.tradeMain}>
//             {item.action} {item.symbol} × {item.qty} @{" "}
//             {Number(item.price).toFixed(2)}
//           </Text>
//           <Text style={styles.tradeSub}>
//             Fee: {Number(item.fee).toFixed(2)}
//             {typeof item.realized_pnl === "number"
//               ? ` · P/L: ${Number(item.realized_pnl).toFixed(2)}`
//               : ""}
//           </Text>
//         </View>
//         <Text style={styles.tradeTs}>{formatTs(when)}</Text>
//       </View>
//     );
//   };

//   // --------------- UI ---------------
//   if (booting) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" />
//         <Text style={{ marginTop: 8 }}>Loading…</Text>
//       </View>
//     );
//   }

//   if (showWelcome) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.h1}>Investor Simulation</Text>
//         <Text style={styles.p}>Create your profile to begin.</Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Your name"
//           value={profileName}
//           onChangeText={setProfileName}
//         />

//         <TouchableOpacity
//           style={styles.primaryBtn}
//           onPress={handleCreateOrLoad}
//           disabled={isSubmittingProfile}
//         >
//           <Text style={styles.primaryText}>
//             {isSubmittingProfile ? "Saving…" : "Continue"}
//           </Text>
//         </TouchableOpacity>

//         {!!message && <Text style={styles.info}>{message}</Text>}
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.select({ ios: "padding", android: undefined })}
//       style={{ flex: 1 }}
//     >
//       <View style={styles.container}>
//         <Text style={styles.h1}>Investor Simulation</Text>
//         <Text style={styles.p}>Cash: ${cashBalance.toFixed(2)}</Text>

//         <View style={styles.row}>
//           <TextInput
//             style={[styles.input, { flex: 1, marginRight: 8 }]}
//             placeholder="Ticker (e.g., NVDA)"
//             autoCapitalize="characters"
//             value={symbol}
//             onChangeText={setSymbol}
//           />
//           <TextInput
//             style={[styles.input, { width: 100 }]}
//             placeholder="Qty"
//             keyboardType="numeric"
//             value={quantity}
//             onChangeText={setQuantity}
//           />
//         </View>

//         <View style={styles.row}>
//           <TouchableOpacity
//             style={[
//               styles.toggle,
//               action === "BUY" && {
//                 backgroundColor: "#e6f4ea",
//                 borderColor: "#34c759",
//               },
//             ]}
//             onPress={() => setAction("BUY")}
//           >
//             <Text
//               style={[
//                 styles.toggleText,
//                 action === "BUY" && { color: "#0a7f2f" },
//               ]}
//             >
//               BUY
//             </Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[
//               styles.toggle,
//               action === "SELL" && {
//                 backgroundColor: "#fff4f4",
//                 borderColor: "#ff3b30",
//               },
//             ]}
//             onPress={() => setAction("SELL")}
//           >
//             <Text
//               style={[
//                 styles.toggleText,
//                 action === "SELL" && { color: "#b00020" },
//               ]}
//             >
//               SELL
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.primaryBtn}
//             onPress={submitTrade}
//             disabled={loading}
//           >
//             <Text style={styles.primaryText}>
//               {loading ? "Submitting…" : "Submit"}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <Text style={styles.sectionTitle}>Positions</Text>
//         <View style={styles.card}>
//           {Object.entries(portfolio).length === 0 ? (
//             <Text style={styles.p}>No positions yet.</Text>
//           ) : (
//             Object.entries(portfolio).map(renderPosition)
//           )}
//         </View>

//         <Text style={styles.sectionTitle}>Recent Trades</Text>
//         <View style={styles.card}>
//           {history.length === 0 ? (
//             <Text style={styles.p}>No trades yet.</Text>
//           ) : (
//             <FlatList
//               data={history}
//               keyExtractor={(item) => String(item.id)}
//               renderItem={renderTrade}
//               ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
//             />
//           )}
//         </View>

//         {!!message && <Text style={styles.info}>{message}</Text>}
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 16 },
//   center: { flex: 1, alignItems: "center", justifyContent: "center" },
//   h1: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: "#111" },
//   p: { color: "#333", marginBottom: 12, fontSize: 14 },

//   input: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 12,
//     backgroundColor: "#fff",
//   },
//   row: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 10 },

//   toggle: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//   },
//   toggleText: { fontWeight: "700", color: "#333" },

//   primaryBtn: {
//     backgroundColor: "#0A1F44",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   primaryText: { color: "#fff", fontWeight: "800" },

//   sectionTitle: {
//     marginTop: 20,
//     marginBottom: 8,
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#0A1F44",
//   },
//   card: {
//     backgroundColor: "#f8fafd",
//     borderRadius: 10,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "#e6edf5",
//   },

//   posRow: { flexDirection: "row", gap: 12, marginBottom: 6 },
//   posSymbol: { fontWeight: "700", color: "#111", width: 70 },
//   posQty: { color: "#333" },
//   posCost: { color: "#333" },

//   tradeRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 8,
//     justifyContent: "space-between",
//   },
//   tradeMain: { fontWeight: "700", color: "#111" },
//   tradeSub: { color: "#666", marginTop: 2 },
//   tradeTs: { color: "#555", marginLeft: 8, minWidth: 110, textAlign: "right" },

//   info: { marginTop: 12, color: "#333" },
// });
