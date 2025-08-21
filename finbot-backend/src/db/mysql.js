// src/db/mysql.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ✅ Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Fa()Md=xQ859ZVK2X",
  database: process.env.DB_NAME || "finbot_db",
  waitForConnections: true,
  connectionLimit: 10,
});

// ✅ Save exchange: ticker + question
export async function saveExchange(ticker, question) {
  try {
    const sql = `INSERT INTO exchanges (ticker, question, created_at) VALUES (?, ?, NOW())`;
    await pool.query(sql, [ticker, question]);
    console.log(`💾 Saved: ${ticker} - "${question}"`);
  } catch (err) {
    console.error("❌ MySQL Save Error:", err.message);
  }
}

// ✅ Add default export for pool
export default pool;
