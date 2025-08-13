// src/services/dataFetcher.js
import yahooFinance from "yahoo-finance2";
yahooFinance.suppressNotices(["yahooSurvey"]);

/** -----------------------
 *  Name → Ticker dictionary
 * ---------------------- */
const tickerMap = {
  TESLA: "TSLA",
  APPLE: "AAPL",
  AMAZON: "AMZN",
  NVIDIA: "NVDA",
  MICROSOFT: "MSFT",
  GOOGLE: "GOOGL",
  META: "META",
  FACEBOOK: "META", // alias
};

/** -----------------------
 *  Normalization & validation
 * ---------------------- */
export function normalizeTicker(input = "") {
  // Uppercase, trim, take the FIRST token only (split on whitespace/commas/semicolons)
  const first =
    String(input)
      .toUpperCase()
      .trim()
      .split(/[,\s;]+/)
      .filter(Boolean)[0] || "";

  // Remove any stray characters; allow A–Z, 0–9, dot, dash
  const cleaned = first.replace(/[^A-Z0-9.\-]/g, "");
  return cleaned.slice(0, 10); // hard cap length
}

export function isValidTicker(t) {
  // Start with a letter; allow letters/digits/dot/dash up to 10 chars total
  return /^[A-Z][A-Z0-9.\-]{0,9}$/.test(t);
}

/** --------------------------------
 *  Resolve ticker from free text
 *  - Prefer dictionary matches
 *  - Otherwise detect a single, valid token
 * -------------------------------- */
export function resolveTicker(input = "") {
  const upper = String(input).toUpperCase();

  // 1) Dictionary match on whole word boundaries
  for (const name in tickerMap) {
    const re = new RegExp(`\\b${name}\\b`, "i");
    if (re.test(upper)) {
      return tickerMap[name];
    }
  }

  // 2) Fallback: pick the FIRST plausible token and normalize/validate
  const firstToken = upper.split(/[,\s;]+/).filter(Boolean)[0] || "";
  const cand = normalizeTicker(firstToken);
  return isValidTicker(cand) ? cand : null;
}

/** --------------------------------
 *  Fetch stock data (safe & timeout)
 * -------------------------------- */
export async function fetchStockData(input) {
  const symbol = normalizeTicker(input);
  if (!isValidTicker(symbol)) {
    return { symbol, price: null, error: "Invalid symbol" };
  }

  let quote;
  try {
    // Add an 8s timeout to avoid hanging; yahoo-finance2 supports a 3rd opts param
    quote = await yahooFinance.quote(symbol, {}, { timeout: 8000 });
  } catch (err) {
    return { symbol, price: null, error: "Quote fetch failed" };
  }

  const price = quote?.regularMarketPrice;
  if (typeof price !== "number") {
    return { symbol, price: null, error: "No regularMarketPrice" };
  }

  return {
    symbol,
    price,
    currency: quote?.currency || "USD",
    peRatio: quote?.trailingPE ?? null,
    forwardPE: quote?.forwardPE ?? null,
    marketCap: quote?.marketCap ?? null,
    error: null,
  };
}
