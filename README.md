FinBot — Personal Finance & Investing Assistant

FinBot is a mobile/web app that helps a beginner investor learn by doing:

💬 Chat with an AI helper (FinBot)

📈 Investor Simulation — place virtual trades, track positions, and see a real timestamped trade history

📚 Learning Hub — quick concepts and glossary

📤 Upload Report — send a PDF of financials and get a concise summary (optional OpenAI key)

⚠️ FinBot is an education tool. It does not provide financial advice.

## Repository Layout
finbot-app/
├─ finbot-backend/ # Node.js/Express + MySQL
└─ finbot-frontend/ # React Native (Expo)

---
Tech Stack

Frontend: React Native + Expo (Android emulator or Web)

Backend: Node.js + Express

Database: MySQL

Optional LLM: OpenAI (for PDF summaries)

Auth & State: AsyncStorage (demo), simple user upsert

---
# Summarized Repo Layout
finbot-app/
├─ finbot-backend/
│  ├─ src/
│  │  └─ routes/
│  │     ├─ auth.js
│  │     └─ reportRoutes.js
│  ├─ server.js
│  ├─ package.json
│  └─ .env  (create)
│
└─ finbot-frontend/
   ├─ screens/
   │  ├─ HomeScreen.js
   │  ├─ ChatScreen.js
   │  ├─ SimulationScreen.js
   │  ├─ DocumentUploadScreen.js
   │  └─ …
   ├─ navigation/AppNavigator.js (or App.js routes)
   ├─ package.json
   └─ app.json
# See Final Report for Detailed Directory Structure.
---
## Prerequisites
- Node.js ≥ 18 and npm ≥ 9 (`node -v`, `npm -v`)
- MySQL 8 on `localhost:3306`
- Git
- Android Studio + Android Emulator (or a physical Android phone with **Expo Go**)

> Windows users: run commands in **PowerShell**.

---
Database Setup

Create a database and the core tables:
CREATE DATABASE IF NOT EXISTS finbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE finbot_db;

-- Minimal user table (demo)
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Accounts (cash, totals)
CREATE TABLE IF NOT EXISTS sim_accounts (
  user_id INT NOT NULL,
  balance DECIMAL(18,2) NOT NULL DEFAULT 10000.00,
  realized_pnl DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  fees_total DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Positions
CREATE TABLE IF NOT EXISTS sim_positions (
  user_id INT NOT NULL,
  symbol  VARCHAR(16) NOT NULL,
  qty     INT NOT NULL,
  avg_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, symbol),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Trades (NOTE: ts has default CURRENT_TIMESTAMP)
CREATE TABLE IF NOT EXISTS sim_trades (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  ts DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  action ENUM('BUY','SELL') NOT NULL,
  symbol VARCHAR(16) NOT NULL,
  qty INT NOT NULL,
  price DECIMAL(18,4) NOT NULL,
  total DECIMAL(18,4) NOT NULL,
  fee DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  realized_pnl DECIMAL(18,2) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_user_ts (user_id, ts),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


---
## 1 Backend Setup (Express + MySQL)

```powershell
cd finbot-backend
npm install
Create .env:


PORT=5000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=finbot
DB_PASSWORD=finbot_pass
DB_NAME=finbot_db

# OpenAI (for chat)
OPENAI_API_KEY=sk-xxxxx

# CORS / auth
CORS_ORIGIN=*
JWT_SECRET=replace_me_dev_secret

cd finbot-backend
npm install
npm run dev             # nodemon server.js
# server listens on http://localhost:5000

---
# Frontend Setup (Expo / React Native)
powershell

cd ../finbot-frontend
npm install

---
Create .env:

EXPO_PUBLIC_API_BASE_ANDROID=http://10.0.2.2:5000
EXPO_PUBLIC_API_BASE_IOS=http://localhost:5000
EXPO_PUBLIC_DEFAULT_LANG=english

---

Run the app:

npx expo start -c
# Press "a" to open on Android emulator
# Or scan the QR with Expo Go on a physical device (same Wi-Fi)
Login/Sign-up flow:

---

# Start for Web (easiest demo):
npx expo start --web

# Start for Android emulator:
npx expo start
# then press: a   (opens emulator)

---
# Key Screens

- Home: entry buttons to Chat, Simulation, Learning, Upload

- Simulation:

  - Enter ticker and quantity

  - Choose BUY/SELL

  - Submit → cash/positions update

  - Recent Trades (shows timestamp)

- Upload Report:

  - Select a PDF from device Downloads

  - Send to backend /reports/summary

  - If OPENAI_API_KEY is set, returns bullet-point summary

---
API Endpoints (Backend)
Users

POST /users/upsert
body: { name: "Alice", goal: "...", risk: "...", interests: [...] }
res:  { userId, profile }

# Simulation
GET  /simulation/portfolio/:userId
res: { cash_balance, portfolio: { AAPL: {qty, avg_cost}, ... } }

GET  /simulation/price?symbol=NVDA
res: { price: 123.45 }

POST /simulation/trade
body: { userId, action: "BUY" | "SELL", symbol: "NVDA", quantity: 2, price? }
res:  { ok: true, ... }

---

# Trades

POST /reports/summary   (form-data: file=<PDF>)
res: { ok, pages, bytes, filename, textPreview, summary? }
---

Scripts

Backend
npm run dev   # nodemon server.js

Frontend
npx expo start        # dev menu (press a for Android, w for Web)
npx expo start --web  # web only

---
License

MIT © 2025 Collen Gura

---
Acknowledgements

React Native, Expo

Express, MySQL

OpenAI (optional summaries)

---