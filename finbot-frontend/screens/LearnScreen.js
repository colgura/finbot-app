// screens/LearnScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, Circle } from "react-native-svg";

/* ---------------- Theme & constants ---------------- */
const palette = {
  bg: "#0B1220",
  card: "#121B2E",
  accent: "#00D1B2",
  text: "#E6EEF8",
  muted: "#9BB0C5",
  danger: "#FF6B6B",
  cheese: "#FFD166",
  mouse: "#8AB4F8",
};
const TABS = ["Flashcards", "Quiz", "Game", "Guide", "P/L Calc", "Examples"];
const STORAGE_KEYS = { PROGRESS: "learn_progress_v1" };
const XP_PER_CHEESE = 10;

// mirror your backend fee model
const FEE_RATE = 0.0005; // 5 bps
const MIN_FEE = 0.5; // $0.50
const calcFee = (notional) =>
  Math.max(MIN_FEE, Number((FEE_RATE * Number(notional)).toFixed(2)));

/* ---------------- Expanded vocabulary ---------------- */
const TERMS = [
  {
    term: "Broker",
    def: "Licensed firm that executes buy/sell orders for you and holds your assets.",
  },
  {
    term: "Brokerage Account",
    def: "Your investment account used to trade and hold securities.",
  },
  {
    term: "Exchange",
    def: "Marketplace where securities are listed and traded (e.g., Nasdaq).",
  },
  { term: "Ticker", def: "Short code for a security (e.g., AAPL, MSFT)." },
  { term: "Bid / Ask", def: "Highest buyer price vs lowest seller price." },
  { term: "Spread", def: "Ask minus Bid; implicit cost to trade." },
  {
    term: "Liquidity",
    def: "How quickly you can buy/sell with small price impact.",
  },
  {
    term: "Market Order",
    def: "Buy/sell immediately at best available price.",
  },
  {
    term: "Limit Order",
    def: "Buy/sell only at your specified price or better.",
  },
  {
    term: "Stop Order",
    def: "Becomes a market order when the stop price is hit.",
  },
  {
    term: "Stop-Limit",
    def: "Becomes a limit order at the stop price; may not fill.",
  },
  {
    term: "Day / GTC",
    def: "Order lasts only today (Day) or until cancelled (GTC).",
  },
  { term: "Execution", def: "When your order is matched and completed." },
  {
    term: "Settlement (T+2)",
    def: "Cash & shares legally transfer two business days after trade.",
  },
  {
    term: "Clearing House",
    def: "Entity that finalizes settlement between brokerages.",
  },
  { term: "Custodian", def: "Institution that safeguards client assets." },
  { term: "Commission / Fee", def: "What the broker charges per trade." },
  {
    term: "Taxes",
    def: "Levies like stamp duty or SEC fees (varies by market).",
  },
  {
    term: "Dividend",
    def: "Cash paid by company to shareholders from profits.",
  },
  {
    term: "Record Date",
    def: "Date you must be on the register to receive a dividend.",
  },
  {
    term: "Ex-Dividend Date",
    def: "Buy on/after this date → no dividend this round.",
  },
  {
    term: "Cum-Dividend",
    def: "Shares include upcoming dividend (buyer receives it).",
  },
  {
    term: "Ex-Dividend",
    def: "Shares trade without the dividend; price often drops by dividend.",
  },
  { term: "Dividend Yield", def: "Dividend per share ÷ price; income rate." },
  { term: "Stock Split", def: "More shares, lower price; value unchanged." },
  {
    term: "Reverse Split",
    def: "Fewer shares, higher price; value unchanged.",
  },
  {
    term: "Rights Issue",
    def: "Offer to buy new shares, usually at a discount, pro-rata.",
  },
  { term: "Bonus Issue", def: "Free additional shares issued to holders." },
  { term: "IPO", def: "First sale of shares by a company to the public." },
  {
    term: "Secondary Offering",
    def: "Company or holders sell additional shares after IPO.",
  },
  { term: "Market Cap", def: "Share price × shares outstanding." },
  { term: "EPS", def: "Earnings per share; company profit per share." },
  {
    term: "P/E Ratio",
    def: "Price ÷ earnings per share; simple valuation gauge.",
  },
  { term: "P/B Ratio", def: "Price ÷ book value per share." },
  { term: "Alpha", def: "Return above a benchmark due to skill/edge." },
  { term: "Beta", def: "Sensitivity to market moves (1.0 ≈ market)." },
  { term: "Volatility", def: "How much price fluctuates over time." },
  {
    term: "Diversification",
    def: "Mix assets to reduce risk from a single name/sector.",
  },
  {
    term: "Dollar-Cost Averaging",
    def: "Invest fixed amounts regularly regardless of price.",
  },
  { term: "Unrealized P/L (UPL)", def: "Gain/loss on positions not yet sold." },
  { term: "Realized P/L", def: "Profit/loss locked in after selling." },
  {
    term: "Breakeven",
    def: "Sell price where proceeds equal total cost (incl. fees).",
  },
  { term: "Index Fund", def: "Fund that tracks an index; usually low cost." },
  {
    term: "ETF",
    def: "Exchange-traded fund; trades like a stock during the day.",
  },
];

/* ---------------- Main Screen ---------------- */
export default function LearnScreen() {
  const [tab, setTab] = useState(TABS[0]);

  // Progress
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
        if (raw) {
          const p = JSON.parse(raw);
          setXp(p?.xp ?? 0);
          setStreak(p?.streak ?? 0);
        }
      } catch {}
      setLoadingProgress(false);
    })();
  }, []);

  const bumpProgress = async (xpGain) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let saved = { xp: 0, streak: 0, lastDate: null };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (raw) saved = JSON.parse(raw);
    } catch {}

    let newStreak = saved.streak || 0;
    if (saved.lastDate === todayStr) {
      // same day, keep streak
    } else {
      newStreak = saved.lastDate ? newStreak + 1 : 1;
    }

    const newXp = (saved.xp || 0) + xpGain;
    const updated = { xp: newXp, streak: newStreak, lastDate: todayStr };

    setXp(newXp);
    setStreak(newStreak);
    await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
  };

  return (
    <View style={styles.container}>
      {/* Header cards */}
      <View style={styles.headerRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{loadingProgress ? "…" : xp}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Daily Streak</Text>
          <Text style={styles.statValue}>
            {loadingProgress ? "…" : `${streak}🔥`}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {tab === "Flashcards" && (
          <Flashcards onMastered={() => bumpProgress(5)} />
        )}
        {tab === "Quiz" && <Quiz onWin={() => bumpProgress(15)} />}
        {tab === "Game" && (
          <MouseAndCheese
            onCheese={async (word) => {
              Speech.speak(`${word.term}. ${word.def}`, {
                rate: 0.98,
                pitch: 1.0,
              });
              await bumpProgress(XP_PER_CHEESE);
            }}
            terms={TERMS}
          />
        )}
        {tab === "Guide" && <Guide onComplete={() => bumpProgress(20)} />}
        {tab === "P/L Calc" && <PLCalc />}
        {tab === "Examples" && (
          <WorkedExamples onCorrect={() => bumpProgress(20)} />
        )}
      </View>
    </View>
  );
}

/* ---------------- Flashcards ---------------- */
function Flashcards({ onMastered }) {
  const [index, setIndex] = useState(0);
  const [showDef, setShowDef] = useState(false);
  const card = TERMS[index];

  const next = () => {
    setShowDef(false);
    setIndex((i) => (i + 1) % TERMS.length);
  };
  const prev = () => {
    setShowDef(false);
    setIndex((i) => (i - 1 + TERMS.length) % TERMS.length);
  };

  return (
    <View style={styles.cardWrap}>
      <Text style={styles.cardTitle}>{card.term}</Text>
      {showDef ? (
        <Text style={styles.cardDef}>{card.def}</Text>
      ) : (
        <Text style={styles.cardHint}>Tap “Flip” to reveal the definition</Text>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.smallBtn} onPress={prev}>
          <Text style={styles.smallBtnText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallBtn, { flex: 2 }]}
          onPress={() => setShowDef((s) => !s)}
        >
          <Text style={styles.smallBtnText}>Flip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={next}>
          <Text style={styles.smallBtnText}>▶</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.masterBtn, { marginTop: 10 }]}
        onPress={() => {
          onMastered?.();
          next();
        }}
      >
        <Text style={styles.masterBtnText}>I know this ✓</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- Quiz (definitions) ---------------- */
function Quiz({ onWin }) {
  const [q, setQ] = useState(null);
  const [status, setStatus] = useState("");

  const newQuestion = () => {
    const idx = Math.floor(Math.random() * TERMS.length);
    const correct = TERMS[idx];
    const pool = TERMS.filter((_, i) => i !== idx);
    const options = [correct, ...shuffle(pool).slice(0, 3)];
    setQ({ correct, options: shuffle(options) });
    setStatus("");
  };

  useEffect(() => {
    newQuestion();
  }, []);

  const pick = (opt) => {
    if (opt.term === q.correct.term) {
      setStatus("✅ Correct!");
      onWin?.();
      setTimeout(newQuestion, 700);
    } else {
      setStatus("❌ Try again");
    }
  };

  if (!q) return <ActivityIndicator color={palette.accent} />;

  return (
    <View style={styles.cardWrap}>
      <Text style={styles.cardTitle}>What does “{q.correct.term}” mean?</Text>
      {q.options.map((o, i) => (
        <TouchableOpacity
          key={i}
          style={styles.quizOption}
          onPress={() => pick(o)}
        >
          <Text style={styles.quizText}>{o.def}</Text>
        </TouchableOpacity>
      ))}
      {!!status && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

/* ---------------- Game: Mouse & Cheese (snake-like) ---------------- */
function MouseAndCheese({ onCheese, terms }) {
  const [layout, setLayout] = useState({
    w: Dimensions.get("window").width - 32,
    h: Dimensions.get("window").height * 0.6,
  });

  const COLS = 18;
  const ROWS = 26;
  const RESERVED = 220; // space reserved for UI
  const sizeByW = Math.floor(Math.min(layout.w, 420) / COLS);
  const sizeByH = Math.floor(Math.max(80, layout.h - RESERVED) / ROWS);
  const SIZE = Math.max(10, Math.min(sizeByW, sizeByH));
  const W = COLS * SIZE;
  const H = ROWS * SIZE;

  const DIRS = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
  };

  const [dir, setDir] = useState(DIRS.RIGHT);
  const [snake, setSnake] = useState([
    [Math.floor(COLS / 2), Math.floor(ROWS / 2)],
  ]);
  const [cheese, setCheese] = useState(randCell(COLS, ROWS, new Set([""])));
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [speed, setSpeed] = useState(140);
  const [score, setScore] = useState(0);
  const [lastWord, setLastWord] = useState(null);

  const occupiedKey = (x, y) => `${x},${y}`;
  const occSet = useMemo(
    () => new Set(snake.map(([x, y]) => occupiedKey(x, y))),
    [snake]
  );

  // Start on arrow / prevent reversal
  const isOpposite = React.useCallback(
    (a, b) => a[0] === -b[0] && a[1] === -b[1],
    []
  );
  const nudge = React.useCallback(
    (targetDir) => {
      setDir((cur) => (isOpposite(cur, targetDir) ? cur : targetDir));
      setRunning(true);
    },
    [isOpposite]
  );

  useEffect(() => {
    const handler = (e) => {
      const k = e.key;
      if (k === "ArrowUp") nudge(DIRS.UP);
      if (k === "ArrowDown") nudge(DIRS.DOWN);
      if (k === "ArrowLeft") nudge(DIRS.LEFT);
      if (k === "ArrowRight") nudge(DIRS.RIGHT);
      if (k === " " || k === "Enter") setRunning((r) => !r);
    };
    if (Platform.OS === "web") window.addEventListener("keydown", handler);
    return () => {
      if (Platform.OS === "web") window.removeEventListener("keydown", handler);
    };
  }, [nudge]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), speed);
    return () => clearInterval(id);
  }, [running, speed]);

  useEffect(() => {
    if (!running) return;
    const [hx, hy] = snake[0];
    const [dx, dy] = dir;
    const nx = hx + dx;
    const ny = hy + dy;

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
      setRunning(false);
      return;
    }
    if (occSet.has(occupiedKey(nx, ny))) {
      setRunning(false);
      return;
    }

    const ate = nx === cheese[0] && ny === cheese[1];
    const next = [[nx, ny], ...snake];
    if (!ate) next.pop();

    setSnake(next);

    if (ate) {
      setCheese(
        randCell(COLS, ROWS, new Set(next.map(([x, y]) => occupiedKey(x, y))))
      );
      setScore((s) => s + 1);

      const word = terms[(score + 1) % terms.length];
      setLastWord(word);
      onCheese?.(word);

      setSpeed((sp) => Math.max(80, sp - 2));
    }
  }, [tick]);

  return (
    <View
      onLayout={(e) =>
        setLayout({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
      style={{ flex: 1 }}
    >
      <View style={styles.gameTop}>
        <Text style={styles.gameTitle}>Mouse & Cheese</Text>
        <Text style={styles.score}>Score: {score}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.control}
          onPress={() => {
            setSnake([[Math.floor(COLS / 2), Math.floor(ROWS / 2)]]);
            setDir(DIRS.RIGHT);
            setCheese(randCell(COLS, ROWS, new Set([""])));
            setSpeed(140);
            setScore(0);
            setRunning(true);
          }}
        >
          <Text style={styles.controlTxt}>Restart</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.canvasWrap, { width: W, height: H }]}>
        <Svg width={W} height={H}>
          <Rect x={0} y={0} width={W} height={H} fill={palette.card} rx={12} />
          <Circle
            cx={cheese[0] * SIZE + SIZE / 2}
            cy={cheese[1] * SIZE + SIZE / 2}
            r={SIZE * 0.38}
            fill={palette.cheese}
          />
          {snake.map(([x, y], i) => (
            <Rect
              key={`${x},${y},${i}`}
              x={x * SIZE + 2}
              y={y * SIZE + 2}
              width={SIZE - 4}
              height={SIZE - 4}
              rx={6}
              fill={i === 0 ? palette.accent : palette.mouse}
            />
          ))}
        </Svg>
      </View>

      {lastWord ? (
        <View style={styles.wordBox}>
          <Text style={styles.wordTitle}>{lastWord.term}</Text>
          <Text style={styles.wordDef}>{lastWord.def}</Text>
        </View>
      ) : (
        <Text style={styles.tip}>
          Press ▶ or arrow to start. Use D-pad or keyboard.
        </Text>
      )}

      {/* D-pad */}
      <View style={styles.dpad}>
        <TouchableOpacity
          style={styles.dbtn}
          hitSlop={10}
          onPress={() => nudge(DIRS.UP)}
        >
          <Text style={styles.dtxt}>↑</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            style={styles.dbtn}
            hitSlop={10}
            onPress={() => nudge(DIRS.LEFT)}
          >
            <Text style={styles.dtxt}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dbtn, { marginHorizontal: 8 }]}
            onPress={() => setRunning((r) => !r)}
          >
            <Text style={styles.dtxt}>{running ? "⏸" : "▶"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dbtn}
            hitSlop={10}
            onPress={() => nudge(DIRS.RIGHT)}
          >
            <Text style={styles.dtxt}>→</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.dbtn}
          hitSlop={10}
          onPress={() => nudge(DIRS.DOWN)}
        >
          <Text style={styles.dtxt}>↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- Guide (step-by-step learning) ---------------- */
function Guide({ onComplete }) {
  const [done, setDone] = useState(false);
  const markDone = () => {
    if (!done) {
      setDone(true);
      onComplete?.();
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }}>
      <Lesson
        title="How to Buy Shares (Start to Finish)"
        bullets={[
          "Choose a broker → open a brokerage account (KYC required).",
          "Deposit funds; know your fees and any taxes.",
          "Search the ticker; decide order type (market vs limit).",
          "Place order: set quantity and (for limit) your price.",
          "Order executes (fully/partially) when matched.",
          "Settlement (T+2): cash & shares legally exchange.",
          "Track your position, average cost, and UPL.",
        ]}
      />
      <Lesson
        title="Fees & Taxes (Typical)"
        bullets={[
          "Commission: broker fee per trade. Your app uses 5 bps with $0.50 minimum.",
          "Spread: ask − bid; hidden cost in market orders.",
          "Taxes: e.g., stamp duty/SEC fees/withholding on dividends (jurisdiction-specific).",
          "Always evaluate total cost: notional ± fees.",
        ]}
      />
      <Lesson
        title="Profit/Loss on a Trade"
        bullets={[
          "Total Buy Cost = Qty × Buy Price + Buy Fee.",
          "Total Sell Proceeds = Qty × Sell Price − Sell Fee.",
          "Realized P/L = Proceeds − Cost (positive = profit).",
          "Breakeven Sell Price ≈ (Cost + Sell Fee)/Qty.",
        ]}
      />
      <Lesson
        title="Dividends: Record, Ex-Date, Cum/Ex"
        bullets={[
          "Record Date: must be on register this day to receive dividend.",
          "Ex-Dividend Date: buy on/after → you do NOT receive this dividend.",
          "Cum-Dividend: price includes upcoming dividend; buyer gets it.",
          "Ex-Dividend: price often drops by roughly the dividend amount.",
          "Don’t buy *just* before ex-date for 'free' cash; price adjusts.",
        ]}
      />
      <Lesson
        title="Avoid These Mistakes"
        bullets={[
          "Using market orders on illiquid stocks → slippage.",
          "Ignoring fees/spread → small profits turn into losses.",
          "Concentrated positions → diversify.",
          "No exit plan → set targets & risk limits.",
        ]}
      />
      <TouchableOpacity
        style={[styles.masterBtn, { marginTop: 10 }]}
        onPress={markDone}
      >
        <Text style={styles.masterBtnText}>
          {done ? "Completed ✔" : "Mark Guide as Completed (+20 XP)"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Lesson({ title, bullets = [] }) {
  return (
    <View style={styles.lessonCard}>
      <Text style={styles.lessonTitle}>{title}</Text>
      {bullets.map((b, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: 6 }}>
          <Text style={{ color: palette.accent, marginRight: 8 }}>•</Text>
          <Text style={{ color: palette.text, flex: 1 }}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

/* ---------------- P/L Calculator ---------------- */
function PLCalc() {
  const [qty, setQty] = useState("100");
  const [buy, setBuy] = useState("10");
  const [sell, setSell] = useState("11");

  const q = Math.max(0, parseInt(qty || "0", 10));
  const bp = Math.max(0, parseFloat(buy || "0"));
  const sp = Math.max(0, parseFloat(sell || "0"));

  const buyNotional = q * bp;
  const sellNotional = q * sp;
  const buyFee = calcFee(buyNotional);
  const sellFee = calcFee(sellNotional);
  const totalCost = buyNotional + buyFee;
  const totalProceeds = sellNotional - sellFee;
  const pnl = Number((totalProceeds - totalCost).toFixed(2));
  const breakeven = q > 0 ? Number(((totalCost + sellFee) / q).toFixed(4)) : 0;

  return (
    <View style={styles.cardWrap}>
      <Text style={styles.cardTitle}>P/L Trainer</Text>
      <Text style={styles.cardHint}>
        Uses the same fee model as your simulator (0.05% min $0.50).
      </Text>

      <View style={styles.row}>
        <Input
          label="Qty"
          value={qty}
          onChangeText={(t) => setQty(t.replace(/[^0-9]/g, ""))}
        />
        <Input
          label="Buy $"
          value={buy}
          onChangeText={(t) => setBuy(t.replace(/[^0-9.]/g, ""))}
        />
        <Input
          label="Sell $"
          value={sell}
          onChangeText={(t) => setSell(t.replace(/[^0-9.]/g, ""))}
        />
      </View>

      <View style={styles.calcBox}>
        <CalcRow label="Buy Notional" value={buyNotional} />
        <CalcRow label="Buy Fee" value={buyFee} />
        <CalcRow label="Total Cost" value={totalCost} bold />
        <CalcRow label="Sell Notional" value={sellNotional} />
        <CalcRow label="Sell Fee" value={sellFee} />
        <CalcRow label="Proceeds" value={totalProceeds} bold />
        <View style={styles.divider} />
        <CalcRow label="Realized P/L" value={pnl} bold colored />
        <CalcRow label="Breakeven Sell $" value={breakeven} />
      </View>
    </View>
  );
}

function Input({ label, value, onChangeText }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: palette.muted, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={styles.input}
        placeholder="0"
        placeholderTextColor="#789"
      />
    </View>
  );
}

function CalcRow({ label, value, bold, colored }) {
  return (
    <View style={styles.calcRow}>
      <Text style={[styles.calcLabel, bold && { fontWeight: "800" }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.calcVal,
          bold && { fontWeight: "800" },
          colored && { color: value >= 0 ? "#2ED47A" : palette.danger },
        ]}
      >
        $
        {Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </Text>
    </View>
  );
}

/* ---------------- Worked Examples (numerical) ---------------- */
function WorkedExamples({ onCorrect }) {
  const [q, setQ] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    newQuestion();
  }, []);

  const newQuestion = () => {
    setFeedback("");
    setAnswer("");
    // rotate types: pnl, breakeven, exdiv
    const types = ["pnl", "breakeven", "exdiv"];
    const type = types[Math.floor(Math.random() * types.length)];

    if (type === "pnl") {
      // Ensure notional big enough so rate-based fees dominate
      const qty = randInt(200, 600);
      const buy = randFloat(10, 60, 2);
      const sell = randFloat(9, 65, 2);
      const buyNotional = qty * buy;
      const sellNotional = qty * sell;
      const buyFee = calcFee(buyNotional);
      const sellFee = calcFee(sellNotional);
      const totalCost = buyNotional + buyFee;
      const proceeds = sellNotional - sellFee;
      const pnl = Number((proceeds - totalCost).toFixed(2));
      setQ({
        type,
        qty,
        buy,
        sell,
        buyFee,
        sellFee,
        totalCost,
        proceeds,
        expected: pnl,
        prompt: `You bought ${qty} shares at $${buy.toFixed(
          2
        )} and later sold at $${sell.toFixed(
          2
        )}. Broker charges 0.05% fee with $0.50 minimum. What is your realized P/L (in $), after all fees?`,
        steps: [
          `Buy Notional = ${qty} × ${fmt(buy)} = ${fmt(buyNotional)}`,
          `Buy Fee = max(0.05% × ${fmt(buyNotional)}, $0.50) = ${fmt(buyFee)}`,
          `Total Cost = ${fmt(buyNotional)} + ${fmt(buyFee)} = ${fmt(
            totalCost
          )}`,
          `Sell Notional = ${qty} × ${fmt(sell)} = ${fmt(sellNotional)}`,
          `Sell Fee = max(0.05% × ${fmt(sellNotional)}, $0.50) = ${fmt(
            sellFee
          )}`,
          `Proceeds = ${fmt(sellNotional)} − ${fmt(sellFee)} = ${fmt(
            proceeds
          )}`,
          `Realized P/L = Proceeds − Total Cost = ${fmt(proceeds)} − ${fmt(
            totalCost
          )} = ${fmt(pnl)}`,
        ],
      });
    } else if (type === "breakeven") {
      // Choose values where fees are definitely rate-based (not min)
      const qty = randInt(400, 800);
      const buy = randFloat(10, 40, 2);
      const buyNotional = qty * buy;
      const buyFee = FEE_RATE * buyNotional; // rate branch
      // Solve for x where (q*x - rate*q*x) = (q*bp + buyFee + sellFee)
      // But sellFee also depends on x: rate*q*x. Breakeven: q*x*(1 - rate) = q*bp + buyFee
      // => x = (bp + buyFee/q) / (1 - rate)
      const x = (buy + buyFee / qty) / (1 - FEE_RATE);
      const expected = round2(x);
      setQ({
        type,
        qty,
        buy,
        buyFee,
        expected,
        prompt: `You buy ${qty} shares at $${buy.toFixed(
          2
        )}. Fees are 0.05% per trade (ignore $0.50 minimum). What sell price gives breakeven after fees?`,
        steps: [
          `Buy Notional = ${qty} × ${fmt(buy)} = ${fmt(buyNotional)}`,
          `Buy Fee = 0.05% × ${fmt(buyNotional)} = ${fmt(buyFee)}`,
          `At breakeven: (Qty × x) − 0.05% × (Qty × x) = Total Cost`,
          `Left side = Qty × x × (1 − 0.0005)`,
          `Total Cost = ${fmt(buyNotional)} + ${fmt(buyFee)} = ${fmt(
            buyNotional + buyFee
          )}`,
          `Solve for x: x = (Buy Price + BuyFee/Qty) / (1 − 0.0005) = ${fmt(
            expected
          )}`,
        ],
      });
    } else {
      // exdiv
      const price = randFloat(40, 120, 2);
      const dividend = randFloat(0.4, 2.5, 2);
      const expected = round2(price - dividend);
      setQ({
        type: "exdiv",
        price,
        dividend,
        expected,
        prompt: `A stock closes cum-dividend at $${price.toFixed(
          2
        )} with a declared dividend of $${dividend.toFixed(
          2
        )}. Ignoring market moves and taxes, what is the theoretical ex-dividend price the next trading day?`,
        steps: [
          `Cum-div price includes the upcoming dividend.`,
          `On ex-div date, price typically drops by roughly the dividend amount.`,
          `Ex-div Price ≈ ${fmt(price)} − ${fmt(dividend)} = ${fmt(expected)}`,
          `Only holders on record date receive the dividend.`,
        ],
      });
    }
  };

  const check = () => {
    if (!q) return;
    const user = parseFloat((answer || "0").replace(/[^0-9.-]/g, ""));
    if (isNaN(user)) {
      setFeedback("Enter a number.");
      return;
    }
    const ok = Math.abs(user - q.expected) <= 0.02; // 2 cents tolerance
    if (ok) {
      setFeedback("✅ Correct! +20 XP");
      onCorrect?.();
      setTimeout(newQuestion, 800);
    } else {
      setFeedback(
        `❌ Not quite. Expected ≈ $${q.expected.toFixed(2)}. See steps below.`
      );
    }
  };

  if (!q) return <ActivityIndicator color={palette.accent} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      <View style={styles.cardWrap}>
        <Text style={styles.cardTitle}>Worked Example</Text>
        <Text style={[styles.cardDef, { marginBottom: 10 }]}>{q.prompt}</Text>

        <Text style={{ color: palette.muted, marginBottom: 6 }}>
          Your answer ($)
        </Text>
        <TextInput
          value={answer}
          onChangeText={(t) => setAnswer(t.replace(/[^\d.\-]/g, ""))}
          keyboardType="numeric"
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#789"
        />

        {!!feedback && (
          <Text style={[styles.status, { marginTop: 10 }]}>{feedback}</Text>
        )}

        <View style={[styles.row, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.smallBtn} onPress={check}>
            <Text style={styles.smallBtnText}>Check Answer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={newQuestion}>
            <Text style={styles.smallBtnText}>New Example</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Steps */}
      {q?.steps?.length ? (
        <View style={[styles.cardWrap, { marginTop: 10 }]}>
          <Text style={styles.cardTitle}>Solution Steps</Text>
          {q.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", marginTop: 6 }}>
              <Text style={{ color: palette.accent, marginRight: 8 }}>•</Text>
              <Text style={{ color: palette.text, flex: 1 }}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

/* ---------------- helpers ---------------- */
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function randCell(cols, rows, occupied) {
  while (true) {
    const x = Math.floor(Math.random() * cols);
    const y = Math.floor(Math.random() * rows);
    const key = `${x},${y}`;
    if (!occupied.has(key)) return [x, y];
  }
}
function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}
function randFloat(a, b, decimals = 2) {
  const v = Math.random() * (b - a) + a;
  return Number(v.toFixed(decimals));
}
function round2(x) {
  return Number(x.toFixed(2));
}
function fmt(v) {
  return `$${Number(v).toFixed(2)}`;
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: 16 },
  headerRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: { color: palette.muted, fontWeight: "600", marginBottom: 4 },
  statValue: { color: palette.text, fontSize: 22, fontWeight: "800" },

  tabs: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#0F1A30",
  },
  tabActive: { backgroundColor: palette.accent },
  tabText: { color: palette.muted, fontWeight: "700" },
  tabTextActive: { color: "#0B1220" },

  content: {
    flex: 1,
    backgroundColor: "#0F1A30",
    borderRadius: 14,
    padding: 12,
    paddingBottom: 16,
  },

  cardWrap: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    flex: 1,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardDef: { color: palette.text, fontSize: 16, lineHeight: 22 },
  cardHint: { color: palette.muted, fontSize: 14 },

  row: { flexDirection: "row", gap: 10, marginTop: 16 },

  smallBtn: {
    flex: 1,
    backgroundColor: palette.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  smallBtnText: { color: "#0B1220", fontWeight: "800" },
  masterBtn: {
    backgroundColor: "#2ED47A",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  masterBtnText: { color: "#04131C", fontWeight: "800" },

  quizOption: {
    backgroundColor: "#0F1A30",
    borderColor: "#1B2947",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  quizText: { color: palette.text, fontSize: 15, lineHeight: 20 },
  status: { marginTop: 10, color: palette.text, fontWeight: "700" },

  gameTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  gameTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  score: { color: palette.text, marginLeft: 12, fontWeight: "700" },
  control: {
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  controlTxt: { fontWeight: "800", color: "#0B1220" },
  canvasWrap: {
    alignSelf: "center",
    backgroundColor: palette.card,
    borderRadius: 12,
    overflow: "hidden",
  },
  dpad: { marginTop: 10, alignItems: "center", gap: 10 },
  dbtn: {
    backgroundColor: palette.accent,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  dtxt: { color: "#0B1220", fontSize: 16, fontWeight: "800" },

  wordBox: {
    backgroundColor: "#0F1A30",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  wordTitle: { color: palette.text, fontWeight: "800", marginBottom: 4 },
  wordDef: { color: palette.muted },
  tip: { color: palette.muted, textAlign: "center", marginTop: 10 },

  // Guide
  lessonCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  lessonTitle: {
    color: palette.text,
    fontWeight: "800",
    marginBottom: 6,
    fontSize: 16,
  },

  // Calc
  input: {
    backgroundColor: "#0F1A30",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1B2947",
    color: palette.text,
  },
  calcBox: {
    marginTop: 16,
    backgroundColor: "#0F1A30",
    borderRadius: 10,
    padding: 12,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  calcLabel: { color: palette.muted },
  calcVal: { color: palette.text },
  divider: {
    height: 1,
    backgroundColor: "#1B2947",
    marginVertical: 8,
    borderRadius: 1,
  },
});
