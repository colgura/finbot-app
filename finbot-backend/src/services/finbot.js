// src/services/finbot.js
import OpenAI from "openai";
import { Readable } from "stream";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyseStock(ticker, userQuestion, stockData) {
  const prompt = `
You are FinBot, an expert financial advisor trained on public equity data.
Here is the real-time stock data:
- Symbol: ${stockData.symbol}
- Current Price: $${stockData.price}
- P/E Ratio: ${stockData.peRatio}
- Forward P/E: ${stockData.forwardPE}
- Market Cap: ${stockData.marketCap}

User Question: "${userQuestion}"

Use this data to provide an insightful answer. 
Cover valuation multiples, growth expectations, risks, and analyst sentiment. 
Always end with a practical takeaway.
`;

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "system",
        content: "You are FinBot, an expert AI financial assistant.",
      },
      { role: "user", content: prompt },
    ],
  });

  const readable = new Readable({
    read() {},
  });

  (async () => {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) readable.push(content);
    }
    readable.push(null);
  })();

  return readable;
}

