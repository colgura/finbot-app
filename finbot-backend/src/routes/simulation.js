// src/routes/simulation.js

import express from "express";
import yahooFinance from "yahoo-finance2";

const router = express.Router();

// ...existing routes above

// ✅ Get current price for a symbol
router.get("/price/:symbol", async (req, res) => {
  const { symbol } = req.params;

  try {
    const result = await yahooFinance.quote(symbol.toUpperCase());

    if (!result || !result.regularMarketPrice) {
      return res.status(404).json({ error: "Symbol not found or invalid" });
    }

    const price = result.regularMarketPrice;

    res.json({ symbol: symbol.toUpperCase(), price });
  } catch (err) {
    console.error("❌ Error fetching price:", err.message);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});

export default router;
