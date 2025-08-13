// screens/PortfolioScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useWindowDimensions } from "react-native";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { colors, fontSizes } from "../styles/theme";

const USER_ID = 1;
const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

// simple palette for slices
const SLICE_COLORS = [
  "#23B5D3",
  "#1F7A8C",
  "#2EC4B6",
  "#FFBF69",
  "#9B5DE5",
  "#F15BB5",
  "#00C49A",
  "#F6AE2D",
  "#4ECDC4",
  "#5567FF",
];
const CASH_COLOR = "#233142";

export default function PortfolioScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [cash, setCash] = useState(0);
  const [positions, setPositions] = useState([]); // [{symbol, qty, avg_cost}]
  const [prices, setPrices] = useState({}); // {SYM: price}
  
  const { width } = useWindowDimensions();
  const donutSize = Math.min(148, width - 72); // was 200
  const strokeW = Math.max(14, Math.round(donutSize * 0.16)); // thinner ring

  const load = useCallback(async () => {
    setError(null);
    try {
      // 1) Portfolio snapshot
      const r = await fetch(`${API_BASE}/simulation/portfolio/${USER_ID}`);
      const data = await r.json();
      if (!r.ok || data.error)
        throw new Error(data.error || `HTTP ${r.status}`);

      const pos =
        data.positions ||
        Object.entries(data.portfolio || {}).map(([symbol, qty]) => ({
          symbol,
          qty: Number(qty),
          avg_cost: 0,
        }));

      setCash(Number(data.cash_balance || 0));
      setPositions(pos);

      // 2) Prices for each symbol
      const syms = pos.map((p) => p.symbol);
      const results = await Promise.all(
        syms.map(async (s) => {
          try {
            const rr = await fetch(
              `${API_BASE}/simulation/price?symbol=${encodeURIComponent(s)}`
            );
            const dd = await rr.json();
            return [s, typeof dd.price === "number" ? dd.price : null];
          } catch {
            return [s, null];
          }
        })
      );
      const map = Object.fromEntries(results);
      setPrices(map);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const arr = positions.map((p, i) => {
      const price = prices[p.symbol] ?? 0;
      const value = price * Number(p.qty || 0);
      return {
        symbol: p.symbol,
        qty: Number(p.qty || 0),
        price,
        value,
        avg_cost: Number(p.avg_cost || 0),
        color: SLICE_COLORS[i % SLICE_COLORS.length],
      };
    });
    const mktTotal = arr.reduce((s, r) => s + r.value, 0);
    const total = mktTotal + cash;
    return {
      rows: arr,
      mktTotal,
      total,
    };
  }, [positions, prices, cash]);

  const alloc = useMemo(() => {
    const items = rows.rows
      .map((r) => ({
        label: r.symbol,
        value: r.value,
        color: r.color,
      }))
      .filter((r) => r.value > 0);

    if (cash > 0) {
      items.push({ label: "CASH", value: cash, color: CASH_COLOR });
    }
    const sum = items.reduce((s, x) => s + x.value, 0) || 1;
    return items.map((x) => ({
      ...x,
      pct: x.value / sum,
    }));
  }, [rows.rows, cash]);

  const askFinBot = () => {
    const desc = alloc
      .map((a) => `${a.label} ${Math.round(a.pct * 100)}%`)
      .join(", ");
    navigation.navigate("Chat", {
      initialQuestion: `Explain my current portfolio (${desc}). What risks, diversification issues, and improvement suggestions do you see?`,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 8 }}>
          Loading portfolio…
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.error || "#ff6b6b" }]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.button} onPress={load}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasPositions = rows.rows.length > 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Text style={styles.title}>📊 My Portfolio</Text>

      {/* Totals */}
      <View style={styles.totalsCard}>
        <Stat label="Cash" value={cash} />
        <Stat label="Securities" value={rows.mktTotal} />
        <Stat label="Total" value={rows.total} bold />
      </View>

      {/* Donut chart */}
      {hasPositions || cash > 0 ? (
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Allocation</Text>
          <Donut data={alloc} size={donutSize} strokeW={strokeW} />
          {/* Legend */}
          {alloc.map((a) => (
            <View key={a.label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: a.color }]} />
              <Text style={styles.legendText}>
                {a.label} — {Math.round(a.pct * 100)}%
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <EmptyPortfolio onGoSim={() => navigation.navigate("Simulation")} />
      )}

      {/* Positions list */}
      {hasPositions && (
        <View style={styles.listCard}>
          <Text style={styles.cardTitle}>Holdings</Text>
          {rows.rows.map((r) => (
            <View key={r.symbol} style={styles.holdingRow}>
              <Text style={[styles.holdingSym, { color: r.color }]}>
                {r.symbol}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.holdingLine}>
                  Qty {r.qty} • Price ${fmt(r.price)} • Value ${fmt(r.value)}
                </Text>
                {r.avg_cost > 0 && (
                  <Text style={styles.holdingSub}>
                    Avg Cost ${fmt(r.avg_cost)}
                  </Text>
                )}
              </View>
              <Text style={styles.holdingPct}>
                {rows.total > 0 ? Math.round((r.value / rows.total) * 100) : 0}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Ask FinBot */}
      <TouchableOpacity style={styles.button} onPress={askFinBot}>
        <Text style={styles.buttonText}>
          Ask FinBot to explain this portfolio
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- Donut (SVG strokes) ---------- */
function Donut({ data, size = 200, strokeW = 26 }) {
  const r = (size - strokeW) / 2;
  const c = 2 * Math.PI * r;

  let offset = 0;
  return (
    <View style={{ alignItems: "center", marginVertical: 10 }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#0F1A30"
          strokeWidth={strokeW}
          fill="none"
        />
        {data.map((s, i) => {
          const len = c * s.pct;
          const dashArray = `${len} ${c - len}`;
          const circle = (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={strokeW}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              fill="none"
              rotation={-90}
              originX={size / 2}
              originY={size / 2}
            />
          );
          offset += len;
          return circle;
        })}
      </Svg>
    </View>
  );
}

/* ---------- Small components ---------- */
function Stat({ label, value, bold }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, bold && { fontWeight: "800" }]}>
        ${fmt(value)}
      </Text>
    </View>
  );
}

function EmptyPortfolio({ onGoSim }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.cardTitle}>No holdings yet</Text>
      <Text style={{ color: "#9BB0C5", marginTop: 6 }}>
        Start in the Investor Simulation to place your first trade.
      </Text>
      <TouchableOpacity
        style={[styles.button, { marginTop: 12 }]}
        onPress={onGoSim}
      >
        <Text style={styles.buttonText}>Open Investor Simulation</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- utils & styles ---------- */
const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 10,
  },
  totalsCard: {
    backgroundColor: "#0F1A30",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: "#0F1A30",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  listCard: {
    backgroundColor: "#0F1A30",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#0F1A30",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  cardTitle: {
    color: "#E6EEF8",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  statLabel: { color: "#9BB0C5", marginBottom: 4 },
  statValue: { color: "#E6EEF8", fontSize: 18, fontWeight: "700" },

  legendRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { color: "#E6EEF8" },

  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1B2947",
  },
  holdingSym: { fontWeight: "800", marginRight: 10 },
  holdingLine: { color: "#E6EEF8" },
  holdingSub: { color: "#9BB0C5", fontSize: 12 },
  holdingPct: {
    color: "#E6EEF8",
    fontWeight: "700",
    marginLeft: 8,
    width: 44,
    textAlign: "right",
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800" },
});
