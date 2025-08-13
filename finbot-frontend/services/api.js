// finbot-frontend/services/api.js
const API_BASE_URL = "http://10.0.2.2:5000"; // ← for Android emulator (not localhost)

export const askFinBot = async (question, language = "english") => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, language }),
    });

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("❌ API call failed:", error.message);
    return "⚠️ Failed to get response from FinBot.";
  }
};
