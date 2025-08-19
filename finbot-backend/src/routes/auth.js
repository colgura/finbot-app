// src/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/mysql.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Quick ping to confirm the file that’s actually loaded
router.get("/_whoami", (_req, res) => {
  res.json({
    ok: true,
    from: "src/routes/auth.js v1",
    time: new Date().toISOString(),
  });
});

/* SIGNUP (local) */
router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, human } = req.body || {};

    // Accept true/“true”/1 or default to true if omitted
    const isHuman =
      human === undefined || human === null
        ? true
        : human === true || human === "true" || human === 1 || human === "1";

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!isHuman) {
      return res.status(400).json({ error: "Human verification failed" });
    }
    console.log("➡️  /auth/signup body:", req.body);


    // email unique?
    const [[exists]] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (exists)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [fullName, email, hash]
    );

    const user = { id: result.insertId, name: fullName, email };
    const token = signToken(user);
    res.status(201).json({ ok: true, token, user });
  } catch (e) {
    console.error("signup error:", e);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* LOGIN (local) */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const [[row]] = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email]
    );
    if (!row) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, row.password_hash || "");
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(row);
    res.json({
      ok: true,
      token,
      user: { id: row.id, name: row.name, email: row.email },
    });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ME (requires Bearer) */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: "Missing bearer token" });

    const payload = jwt.verify(m[1], JWT_SECRET);
    const [[row]] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ?",
      [payload.sub]
    );
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true, user: row });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
