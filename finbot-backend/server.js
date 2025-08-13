// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import pool from "./src/db/mysql.js";
import {
  resolveTicker,
  fetchStockData,
  normalizeTicker,
  isValidTicker,
} from "./src/services/dataFetcher.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Log every request path & method to diagnose mismatches
app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.path}`);
  next();
});


// ----- Fee model -----
const FEE_RATE = 0.0005; // 5 bps
const MIN_FEE = 0.5; // $0.50
const calcFee = (notional) =>
  Math.max(MIN_FEE, Number((FEE_RATE * Number(notional)).toFixed(2)));

// ---------- Health ----------
app.get("/", (req, res) => {
  res.json({ ok: true, message: "✅ FinBot Backend API is running." });
});

// ---------- SSE: /ask ----------
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/ask", async (req, res) => {
  const { question = "", language = "english" } = req.query;
  console.log(`📩 Question: "${question}" | Language: ${language}`);

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt =
      language === "shona"
        ? `Iwe uri chipangamazano wezvemari. Zvese zvamunopindura zvichava muchiShona chete. Usashandise Chirungu zvachose kunze kwekuti uchiudza mazwi anonyanya kushandiswa muChirungu. Kana shoko racho riri reChirungu, tsanangura zvarinoreva muchiShona. Muenzaniso: "Dividend ishoko rinoreva mubhadharo unobva mukambani, unopiwa kune vanotenga zvikamu (shareholders)." Shandisa mazwi akareruka uye mashoko anozivikanwa.`
        : "You are a financial advisor. Reply clearly and simply in English.";

    let userPrompt = question;
    const extracted = resolveTicker(question);
    const ticker = normalizeTicker(extracted);
    if (ticker && isValidTicker(ticker)) {
      try {
        const stockData = await fetchStockData(ticker);
        if (typeof stockData?.price === "number") {
          userPrompt = `
User Question: ${question}

Here is real-time stock data:
- Symbol: ${stockData.symbol}
- Current Price: ${stockData.price} ${stockData.currency}
- P/E Ratio: ${stockData.peRatio}
- Forward P/E: ${stockData.forwardPE}
- Market Cap: ${stockData.marketCap}

Based on this data:
1. Give a verdict (Overvalued, Fairly Valued, or Undervalued).
2. Explain briefly why using valuation logic.
3. End with a practical takeaway for an investor.
`;
        }
      } catch (e) {
        console.warn("⚠️ Could not enrich with stock data:", e?.message || e);
      }
    }

    const reinforcedPrompt =
      language === "shona"
        ? `Pindura mubvunzo uyu muchiShona chete, usingashandisi Chirungu kunze kwekuti uri kutsanangura shoko: ${userPrompt}`
        : userPrompt;

    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: reinforcedPrompt },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) res.write(`data: ${content}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("❌ Streaming error:", error);
    res.write("data: Error occurred\n\n");
    res.end();
  }
});

// ---------- Helpers ----------
async function getPortfolio(userId) {
  const [[acct]] = await pool.query(
    "SELECT balance, realized_pnl, fees_total FROM sim_accounts WHERE user_id = ?",
    [userId]
  );
  const [rows] = await pool.query(
    "SELECT symbol, qty, avg_cost FROM sim_positions WHERE user_id = ? ORDER BY symbol",
    [userId]
  );
  const [trades] = await pool.query(
    `SELECT id, ts, action, symbol, qty, price, total, fee, realized_pnl
     FROM sim_trades
     WHERE user_id = ?
     ORDER BY ts DESC
     LIMIT 100`,
    [userId]
  );

  const holdings = {};
  for (const r of rows) holdings[r.symbol] = r.qty;

  return {
    cash_balance: acct ? Number(acct.balance) : 0,
    realized_pnl: acct ? Number(acct.realized_pnl) : 0,
    fees_total: acct ? Number(acct.fees_total) : 0,
    portfolio: holdings, // legacy shape for current UI
    positions: rows.map((r) => ({
      symbol: r.symbol,
      qty: Number(r.qty),
      avg_cost: Number(r.avg_cost),
    })), // richer data for upgraded UI
    history: trades.map((t) => ({
      id: String(t.id),
      ts: t.ts?.toISOString?.() || t.ts,
      action: t.action,
      symbol: t.symbol,
      quantity: Number(t.qty),
      price: Number(t.price),
      total: Number(t.total),
      fee: Number(t.fee),
      realized_pnl: t.realized_pnl == null ? null : Number(t.realized_pnl),
    })),
  };
}

async function ensureUserAccount(conn, userId) {
  await conn.query("INSERT IGNORE INTO users (id, name) VALUES (?, 'User')", [
    userId,
  ]);
  await conn.query(
    "INSERT IGNORE INTO sim_accounts (user_id, balance) VALUES (?, 10000.00)",
    [userId]
  );
}

// ---------- Simulation API ----------

// GET portfolio (cash + positions + history)
app.get("/simulation/portfolio/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ error: "Invalid userId" });

    const conn = await pool.getConnection();
    try {
      await ensureUserAccount(conn, userId);
    } finally {
      conn.release();
    }

    const snapshot = await getPortfolio(userId);
    res.json(snapshot);
  } catch (e) {
    console.error("Portfolio error:", e);
    res.status(500).json({ error: "Failed to load portfolio" });
  }
});

// GET live price
app.get("/simulation/price", async (req, res) => {
  const symbol = normalizeTicker(req.query.symbol || "");
  if (!isValidTicker(symbol)) {
    return res.status(400).json({ price: null, error: "Invalid symbol" });
  }
  try {
    const data = await fetchStockData(symbol);
    res.json({ price: data?.price ?? null, error: data?.error ?? null });
  } catch (e) {
    console.error("Price fetch error:", e?.message || e);
    res.json({ price: null, error: "Lookup failed" });
  }
});

// POST order (transactional) with fees, avg_cost, realized P&L
app.post("/simulation/order", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    let { userId, action, symbol, quantity } = req.body || {};
    userId = Number(userId);
    action = String(action || "").toUpperCase();
    symbol = normalizeTicker(symbol || "");
    quantity = parseInt(quantity, 10);

    if (
      !userId ||
      !["BUY", "SELL"].includes(action) ||
      !isValidTicker(symbol) ||
      !quantity ||
      quantity <= 0
    ) {
      return res.status(400).json({ error: "Invalid order payload" });
    }

    const data = await fetchStockData(symbol).catch(() => null);
    const price = data?.price;
    if (typeof price !== "number") {
      return res.status(400).json({ error: "Price not available" });
    }

    const notional = Number((price * quantity).toFixed(4));
    const fee = calcFee(notional);

    await conn.beginTransaction();

    await ensureUserAccount(conn, userId);

    // lock account & position
    const [[acct]] = await conn.query(
      "SELECT balance, realized_pnl, fees_total FROM sim_accounts WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    const [[pos]] = await conn.query(
      "SELECT qty, avg_cost FROM sim_positions WHERE user_id = ? AND symbol = ? FOR UPDATE",
      [userId, symbol]
    );

    const currBal = acct ? Number(acct.balance) : 0;
    const currQty = pos ? Number(pos.qty) : 0;
    const currAvg = pos ? Number(pos.avg_cost) : 0;

    if (action === "BUY") {
      const debit = Number((notional + fee).toFixed(2));
      if (currBal < debit) {
        await conn.rollback();
        return res.status(400).json({ error: "Insufficient cash" });
      }

      // Update cash & fees
      await conn.query(
        "UPDATE sim_accounts SET balance = balance - ?, fees_total = fees_total + ? WHERE user_id = ?",
        [debit, fee, userId]
      );

      // Weighted-average cost update
      const newQty = currQty + quantity;
      if (currQty === 0) {
        const newAvg = Number(((notional + fee) / quantity).toFixed(6));
        await conn.query(
          "INSERT INTO sim_positions (user_id, symbol, qty, avg_cost) VALUES (?, ?, ?, ?)",
          [userId, symbol, newQty, newAvg]
        );
      } else {
        const newCostBasis = currQty * currAvg + notional + fee;
        const newAvg = Number((newCostBasis / newQty).toFixed(6));
        await conn.query(
          "UPDATE sim_positions SET qty = ?, avg_cost = ? WHERE user_id = ? AND symbol = ?",
          [newQty, newAvg, userId, symbol]
        );
      }

      // Trade row (no realized P/L on buy)
      await conn.query(
        `INSERT INTO sim_trades (user_id, ts, action, symbol, qty, price, total, fee, realized_pnl)
         VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, NULL)`,
        [userId, action, symbol, quantity, price, notional, fee]
      );
    } else {
      // SELL
      if (currQty < quantity) {
        await conn.rollback();
        return res.status(400).json({ error: "Insufficient quantity" });
      }

      const proceeds = Number((notional - fee).toFixed(2));
      const realized = Number(((price - currAvg) * quantity - fee).toFixed(2));

      // Update account (cash, realized pnl, fees)
      await conn.query(
        "UPDATE sim_accounts SET balance = balance + ?, realized_pnl = realized_pnl + ?, fees_total = fees_total + ? WHERE user_id = ?",
        [proceeds, realized, fee, userId]
      );

      const newQty = currQty - quantity;
      if (newQty === 0) {
        await conn.query(
          "DELETE FROM sim_positions WHERE user_id = ? AND symbol = ?",
          [userId, symbol]
        );
      } else {
        // WAC doesn't change on sell (only qty drops)
        await conn.query(
          "UPDATE sim_positions SET qty = ? WHERE user_id = ? AND symbol = ?",
          [newQty, userId, symbol]
        );
      }

      // Trade row (with realized P/L)
      await conn.query(
        `INSERT INTO sim_trades (user_id, ts, action, symbol, qty, price, total, fee, realized_pnl)
         VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
        [userId, action, symbol, quantity, price, notional, fee, realized]
      );
    }

    await conn.commit();

    const snapshot = await getPortfolio(userId);
    res.json({
      message: `${action} ${symbol} x${quantity} @ ${price.toFixed(2)}`,
      ...snapshot,
    });
  } catch (e) {
    await conn.rollback();
    console.error("Order error:", e);
    res.status(500).json({ error: "Failed to process order" });
  } finally {
    conn.release();
  }
});

// ---- Profile endpoints (used by Welcome screen) ----
// Accept multiple legacy paths just in case your UI calls a different one
// ---- Profile helpers ----
async function getOrCreateUserId(conn, { userId, name }) {
  if (Number(userId)) return Number(userId);
  const clean = String(name || "").trim();
  if (!clean) return null;

  // Try existing by exact name
  const [rows] = await conn.query("SELECT id FROM users WHERE name = ? ORDER BY id DESC LIMIT 1", [clean]);
  if (rows.length) return Number(rows[0].id);

  // Create new
  const [ins] = await conn.query("INSERT INTO users (name) VALUES (?)", [clean]);
  const newId = Number(ins.insertId);
  await conn.query(
    "INSERT IGNORE INTO sim_accounts (user_id, balance) VALUES (?, 10000.00)",
    [newId]
  );
  return newId;
}

// ---- SAVE profile: accept GET or POST on many likely paths ----
const profilePaths = [
  "/profile",
  "/user/profile",
  "/saveProfile",
  "/save-profile",
  "/api/profile",
  "/api/saveProfile",
  "/api/save-profile",
  "/simulation/profile",
];

app.all(profilePaths, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const src = req.method === "GET" ? req.query : req.body;
    let { userId = null, name = "", goal = null, risk = null, interests = null } = src || {};
    name = String(name || "").trim();

    await conn.beginTransaction();

    const id = await getOrCreateUserId(conn, { userId, name });
    if (!id) {
      await conn.rollback();
      return res.status(400).json({ error: "Missing name or userId" });
    }

    if (name) {
      await conn.query("UPDATE users SET name=? WHERE id=?", [name, id]);
    }

    await conn.query(
      `INSERT INTO sim_profiles (user_id, name, goal, risk, interests)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         name=VALUES(name),
         goal=VALUES(goal),
         risk=VALUES(risk),
         interests=VALUES(interests)`,
      [id, name || null, goal, risk, interests ? JSON.stringify(interests) : null]
    );

    await conn.commit();

    res.json({
      ok: true,
      userId: id,
      profile: { name, goal, risk, interests: interests || null },
      message: "Profile saved",
    });
  } catch (e) {
    await conn.rollback();
    console.error("Profile save error:", e);
    res.status(500).json({ error: "Failed to save profile" });
  } finally {
    conn.release();
  }
});

// ---- FETCH profile by id OR name (one path) ----
// Example: GET /profile/1  OR  GET /profile/Collen
app.get("/profile/:idOrName", async (req, res) => {
  try {
    const idOrName = req.params.idOrName;
    const isNumeric = /^\d+$/.test(idOrName);

    let userId;
    if (isNumeric) {
      userId = Number(idOrName);
    } else {
      const [[u]] = await pool.query(
        "SELECT id FROM users WHERE name = ? ORDER BY id DESC LIMIT 1",
        [String(idOrName).trim()]
      );
      if (!u) return res.status(404).json({ error: "User not found" });
      userId = Number(u.id);
    }

    const [[row]] = await pool.query(
      `SELECT u.id AS user_id, COALESCE(p.name, u.name) AS name, p.goal, p.risk, p.interests,
              a.balance, a.realized_pnl, a.fees_total
       FROM users u
       LEFT JOIN sim_profiles p ON p.user_id = u.id
       LEFT JOIN sim_accounts a ON a.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!row) return res.status(404).json({ error: "User not found" });

    res.json({
      ok: true,
      userId,
      profile: {
        name: row.name,
        goal: row.goal,
        risk: row.risk,
        interests: row.interests ? JSON.parse(row.interests) : null,
      },
      account: {
        balance: Number(row.balance ?? 0),
        realized_pnl: Number(row.realized_pnl ?? 0),
        fees_total: Number(row.fees_total ?? 0),
      },
    });
  } catch (e) {
    console.error("Profile fetch error:", e);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// ---- Users upsert endpoint for Welcome screen ----
// Accepts body: { userId?, name, goal?, risk?, interests? }
app.post("/users/upsert", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    let { userId = null, name = "", goal = null, risk = null, interests = null } = req.body || {};
    name = String(name || "").trim();

    if (!name && !userId) {
      return res.status(400).json({ error: "Missing name or userId" });
    }

    await conn.beginTransaction();

    // Resolve userId (by provided id, or by name, else create)
    let id = Number(userId) || null;
    if (!id) {
      const [rows] = await conn.query(
        "SELECT id FROM users WHERE name = ? ORDER BY id DESC LIMIT 1",
        [name]
      );
      if (rows.length) {
        id = Number(rows[0].id);
      } else {
        // create new user (assumes users.id is AUTO_INCREMENT)
        const [ins] = await conn.query("INSERT INTO users (name) VALUES (?)", [name]);
        id = Number(ins.insertId);
      }
    }

    // keep users.name fresh
    if (name) {
      await conn.query("UPDATE users SET name=? WHERE id=?", [name, id]);
    }

    // ensure account exists (won't reset existing balance)
    await conn.query(
      "INSERT IGNORE INTO sim_accounts (user_id, balance) VALUES (?, 10000.00)",
      [id]
    );

    // upsert profile
    await conn.query(
      `INSERT INTO sim_profiles (user_id, name, goal, risk, interests)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         name=VALUES(name),
         goal=VALUES(goal),
         risk=VALUES(risk),
         interests=VALUES(interests)`,
      [id, name || null, goal, risk, interests ? JSON.stringify(interests) : null]
    );

    await conn.commit();

    res.json({
      ok: true,
      userId: id,
      profile: { name, goal, risk, interests: interests || null },
      message: "Profile saved",
    });
  } catch (e) {
    await conn.rollback();
    console.error("Users upsert error:", e);
    res.status(500).json({ error: "Failed to upsert user/profile" });
  } finally {
    conn.release();
  }
});



// ---------- JSON-only fallbacks ----------
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({ error: "Internal Server Error", detail: err.message });
});

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
