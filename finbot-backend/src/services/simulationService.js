import SimulationState from "../models/SimulationState.js";
import TransactionHistory from "../models/TransactionHistory.js";
import { fetchStockData } from "./dataFetcher.js";

// ✅ Fetch or create simulation state
export async function getSimulationState(userId) {
  let state = await SimulationState.findOne({ where: { userId } });
  if (!state) {
    state = await SimulationState.create({ userId });
  }
  return state;
}

// ✅ Execute Buy or Sell
export async function executeOrder(userId, type, stockSymbol, qty) {
  const state = await getSimulationState(userId);
  const stockData = await fetchStockData(stockSymbol);
  if (!stockData) throw new Error("Stock data unavailable");

  const price = stockData.price;
  const cost = price * qty;
  const holdings = state.holdings || {};

  if (type === "BUY") {
    if (state.cashBalance < cost) throw new Error("Insufficient funds");
    state.cashBalance -= cost;
    holdings[stockSymbol] = (holdings[stockSymbol] || 0) + qty;
  } else if (type === "SELL") {
    if (!holdings[stockSymbol] || holdings[stockSymbol] < qty) {
      throw new Error("Not enough shares to sell");
    }
    state.cashBalance += cost;
    holdings[stockSymbol] -= qty;
    if (holdings[stockSymbol] === 0) delete holdings[stockSymbol];
  }

  state.holdings = holdings;
  await state.save();

  await TransactionHistory.create({ userId, stockSymbol, type, qty, price });
  return { state, transaction: { stockSymbol, type, qty, price } };
}
