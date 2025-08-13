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
│   │   └── SimulationPortfolioCard.js   # NEW Component for simulation portfolio
│   ├── context/
│   │   ├── AppContext.js
│   │   ├── LanguageContext.js
│   ├── screens/
│   │   ├── ChatScreen.js
│   │   ├── DocumentUploadScreen.js
│   │   ├── InvestorSimulationScreen.js  # UPDATED for Simulation UI
│   │   └── HomeScreen.js
│   ├── services/
│   │   ├── api.js                       # Updated with simulation endpoints
│   ├── App.js
│   └── package.json
|
└── README.md

# ------------------------------------------------

Ah, that little floating toolbar is the React Native “Element Inspector” / zoom overlay from the Android emulator. It shows +, 1:1, and a </> icon. Easy to hide:

Turn off the Inspector

With the emulator focused, press Ctrl + M (Windows/Linux) or Cmd + M (macOS).

In the Developer Menu, tap Toggle Element Inspector (turn it off).

If the zoom buttons remain:

Hide emulator zoom controls

Click the emulator’s … (Extended Controls) → Settings → General (or Emulator on some versions) → turn Show zoom controls Off.

Or use shortcut Ctrl + Shift + Z to toggle.

Worst case, close & reopen Expo Go (or the emulator) and they’ll be gone.
