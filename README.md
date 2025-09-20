# FinBot Project
# finbot-app/
|
├── finbot-backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── db/
│   │   │   └── mysql.js                 # MySQL connection
│   │   ├── models/
│   │   │   ├── SimulationState.js       # Tracks user's portfolio & cash
│   │   │   ├── TransactionHistory.js    # Buy/Sell logs
│   │   ├── services/
│   │   │   ├── dataFetcher.js           # Yahoo Finance API integration
│   │   │   ├── finbot.js                # Chatbot logic
│   │   │   └── simulationService.js     # Simulation business logic
│   │   ├── routes/
│   │   │   ├── simulationRoutes.js      # API endpoints for simulation
│   │   │   └── finbotRoutes.js          # Existing chatbot endpoints
│   │   └── utils/
│   │       └── promptBuilder.js
│   ├── .env
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js                        # Express entry point
│   └── streaming.js
|
├── finbot-frontend/
│   ├── assets/
│   ├── components/
│   │   ├── ChatBubble.js
│   │   ├── DocumentCard.js
│   │   ├── StockCard.js
│   │   ├── SimulationPortfolioCard.js   
│   │   └── StockCard.js
│   ├── context/
│   │   ├── AppContext.js
│   │   └── LanguageContext.js
│   ├── data/
│   │   └── glossary.json.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── MainTabs.js
│   ├── screens/
│   │   ├── ChatScreen.js
│   │   ├── AuthScreen.js
│   │   ├── ChatScreen.js  
│   │   ├── DocumentUploadScreen.js
│   │   ├── GlossaryScreen.js 
│   │   ├── HomeScreen.js  
│   │   ├── InvestorSimulationScreen.js
│   │   ├── IonconsTest.js  
│   │   ├── LearnScreen.js
│   │   ├── LoginScreen.js  
│   │   ├── OnboardingNavigator.js
│   │   ├── OnboardingScreen.js  
│   │   ├── PortfolioScreen.js
│   │   ├── ProfileScreen.js  
│   │   ├── RegisterScreen.js
│   │   ├── ReportUploadScreen.js
│   │   ├── SettingsScreen.js  
│   │   └── SimulationScreen.js
│   ├── services/
│   │   ├── api.js  
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                 
│   │   ├── context/
│   │   │   ├── AuthContext.js      
│   │   │   └── i18nContext.js    
│   │   ├── hooks/
│   │   │   ├── useUserScopedState.js.js      
│   │   │   └── i18nContext.js 
│   │   ├── utils/
│   │   │   ├── api.js      
│   │   │   └── storage.js 
│   ├── styles/
│   │   └── theme.js  
│   ├── .gitignore                  
│   ├── App.js
│   ├── package-lock.json
│   └── package.json
├── .gitignore
├── app.json
├── babel.config.js
├── package-lock.json
├── package.json
|
└── README.md

# FinBot Project Setup (Dev) 
1) Prerequisites 
   Node.js ≥ 18 (check: node -v) 
   npm ≥ 9 (or yarn) 
   MySQL 8 running on localhost:3306 
   Git 
   Android Studio + Emulator (or a real Android device with Expo Go) 
   Expo CLI: npm i -g expo-cli (optional; npx expo also works)

2) Clone the repo 
   git clone https://github.com/colgura/finbot-app.git 
   cd finbot-app

3) Backend (Node.js/Express) 
   3.1 Install 
   cd finbot-backend 
   npm install

    3.2 MySQL: create DB + user (skip if already set up) 
    -- In the MySQL shell: 
    CREATE DATABASE IF NOT EXISTS finbot_db CHARACTER SET utf8mb4 
    COLLATE utf8mb4_0900_ai_ci; 
    
    CREATE USER IF NOT EXISTS 'finbot'@'localhost' IDENTIFIED BY 
    'finbot_pass'; 
    GRANT ALL PRIVILEGES ON finbot_db.* TO 'finbot'@'localhost'; 
    FLUSH PRIVILEGES;

    3.3 Environment 
    Create finbot-backend/.env: 
    PORT=5000 
    NODE_ENV=development 
    # MySQL 
    DB_HOST=localhost 
    DB_PORT=3306 
    DB_USER=finbot 
    DB_PASSWORD=finbot_pass 
    DB_NAME=finbot_db

    # OpenAI (only required for chat/summariser) 
    OPENAI_API_KEY=sk-xxxxx 
    
    # CORS / auth 
    CORS_ORIGIN=* 
    JWT_SECRET=replace_me_dev_secret 

    # Optional cache (ms) for price lookups 
    YF_CACHE_TTL=60000 3.4 Schema (tables)

    # If DB is empty, run the DDL below once (matches the ERD & current tables): 
    
    USE finbot_db;

    # users table
    CREATE TABLE IF NOT EXISTS users ( 
        id INT NOT NULL AUTO_INCREMENT, 
        name VARCHAR(100) NOT NULL, 
        email VARCHAR(255) NOT NULL, 
        password_hash VARCHAR(255) DEFAULT NULL, 
        google_id VARCHAR(255) DEFAULT NULL, 
        facebook_id VARCHAR(255) DEFAULT NULL, 
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, 
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (id), 
        UNIQUE KEY email (email), 
        UNIQUE KEY google_id (google_id), 
        UNIQUE KEY facebook_id (facebook_id) 
        ) ENGINE=InnoDB;
    
    # sim_profiles table
    CREATE TABLE IF NOT EXISTS sim_profiles ( 
        user_id INT NOT NULL, 
        name VARCHAR(100) NOT NULL, 
        goal VARCHAR(100) DEFAULT NULL, 
        risk VARCHAR(20) DEFAULT NULL, 
        interests JSON DEFAULT NULL, 
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (user_id), 
        CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
        ) ENGINE=InnoDB;

    # sim_accounts table
    CREATE TABLE IF NOT EXISTS sim_accounts ( 
        user_id INT NOT NULL, 
        balance DECIMAL(18,2) NOT NULL DEFAULT '0.00', 
        realized_pnl DECIMAL(18,2) NOT NULL DEFAULT '0.00', 
        fees_total DECIMAL(18,2) NOT NULL DEFAULT '0.00', 
        PRIMARY KEY (user_id), 
        CONSTRAINT sim_accounts_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE 
        ) ENGINE=InnoDB;

    # sim_positions table
    CREATE TABLE IF NOT EXISTS sim_positions ( 
        id INT NOT NULL AUTO_INCREMENT, 
        user_id INT NOT NULL, 
        symbol VARCHAR(16) NOT NULL, 
        qty INT NOT NULL, 
        avg_cost DECIMAL(18,6) NOT NULL DEFAULT '0.000000', 
        PRIMARY KEY (id), 
        UNIQUE KEY uniq_user_symbol (user_id, symbol), 
        CONSTRAINT sim_positions_ibfk_1 FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE 
        ) ENGINE=InnoDB;

    # sim_trades table
    CREATE TABLE IF NOT EXISTS sim_trades ( 
        id BIGINT NOT NULL AUTO_INCREMENT, 
        user_id INT NOT NULL, 
        ts DATETIME NOT NULL, 
        action ENUM('BUY','SELL') NOT NULL, 
        symbol VARCHAR(16) NOT NULL, 
        qty INT NOT NULL, 
        price DECIMAL(18,4) NOT NULL, 
        total DECIMAL(18,4) NOT NULL, 
        fee DECIMAL(18,2) NOT NULL DEFAULT '0.00', 
        realized_pnl DECIMAL(18,2) DEFAULT NULL, 
        PRIMARY KEY (id), 
        KEY idx_user_ts (user_id, ts), 
        CONSTRAINT sim_trades_ibfk_1 FOREIGN KEY (user_id) REFERENCES 
        users(id) ON DELETE CASCADE 
        ) ENGINE=InnoDB;

    # exchanges table
    CREATE TABLE IF NOT EXISTS exchanges ( 
        id INT NOT NULL AUTO_INCREMENT, 
        ticker VARCHAR(10) DEFAULT NULL, 
        question TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (id) 
        ) ENGINE=InnoDB;

    # transaction_history
    CREATE TABLE IF NOT EXISTS transaction_history ( 
        id INT NOT NULL AUTO_INCREMENT, 
        user_id INT NOT NULL, 
        action ENUM('BUY','SELL') NOT NULL, 
        symbol VARCHAR(10) NOT NULL, 
        quantity INT NOT NULL, 
        price DECIMAL(10,2) NOT NULL, 
        timestamp TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (id) 
        ) ENGINE=InnoDB;

    # simulation_state
    CREATE TABLE IF NOT EXISTS simulation_state ( 
        id INT NOT NULL AUTO_INCREMENT, 
        user_id INT NOT NULL, 
        cash_balance DECIMAL(15,2) DEFAULT '10000.00', 
        portfolio JSON DEFAULT NULL, 
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id) ) ENGINE=InnoDB;

    # 3.5 (Optional) Seed a demo user 
    USE finbot_db;

    # Running the DB
    INSERT INTO users(name,email,password_hash) 
    VALUES ('Demo User','demo@example.com','$2b$10$replaceWithRealBcryptHash'); 
    
    -- Start them with $10,000 cash 
    INSERT INTO sim_accounts(user_id,balance,realized_pnl,fees_total) 
    VALUES (LAST_INSERT_ID(), 10000.00, 0.00, 0.00);

    # Tip: Generate a bcrypt hash with an online tool or a tiny Node script if you’re using password login. 
    3.6 Run the backend 
    npm run dev 
    # or node server.js 
    Expected: Server listening on :5000 and successful DB connection logs. 
    3.7 Backend smoke tests 
    # Health (if you have one) 
    curl http://localhost:5000/health 

    # Chat (SSE): open in a browser: 
    http://localhost:5000/ask?
    question=Is%20NVDA%20overvalued%3F&language=english

    4) Frontend (React Native / Expo) 
       4.1 Install 
       cd ../finbot-frontend 
       npm install 4.2 Environment (Expo public vars) 
       Create finbot-frontend/.env: 
       EXPO_PUBLIC_API_BASE_ANDROID=http://10.0.2.2:5000 
       EXPO_PUBLIC_API_BASE_IOS=http://localhost:5000 
       EXPO_PUBLIC_DEFAULT_LANG=english Update your API base helper to read those (recommended): // finbot-frontend/src/utils/api.js (or your existing client) import { Platform } from 'react-native'; export const API_BASE = Platform.OS === 'android' ? process.env.EXPO_PUBLIC_API_BASE_ANDROID : process.env.EXPO_PUBLIC_API_BASE_IOS;

       4.3 Run the app 
       npx expo start -c 
       # Press 'a' to launch Android emulator, or scan QR with Expo Go

       5) Expected Navigation Flow 
          Onboarding → collects name, goal, risk, interests (stored server-side; 
          minimal echo in AsyncStorage). 
          Login/Register → obtains token; token stored in AsyncStorage. 
          Home → navigate to Portfolio, Chat, Learn, Settings. 
          
          If you still see an incorrect flow (e.g., Login → Onboarding → Home in the wrong order), clear caches: 
          Metro cache: stop Expo, run npx expo start -c 
          AsyncStorage: Settings → “Clear local data” (if you added it), or reinstall 
          Expo Go. 
        6) Quick Smoke Checklist