import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [messages, setMessages] = useState([
    "Hi, I'm FinBot!",
    "Ask me anything about stocks or markets.",
  ]);

  return (
    <AppContext.Provider value={{ messages, setMessages }}>
      {children}
    </AppContext.Provider>
  );
};
