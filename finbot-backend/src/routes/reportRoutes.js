// src/routes/reportRoutes.js
import express from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/summarize", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: "No file" });

    // 1) Extract text from PDF
    const parsed = await pdfParse(req.file.buffer);
    let text = (parsed.text || "").replace(/\s+/g, " ").trim();
    if (!text)
      return res
        .status(400)
        .json({ ok: false, error: "No extractable text in PDF" });

    // 2) Keep it within token-safe bounds for a single pass (simple MVP)
    const MAX_CHARS = 12000; // ~3–4k tokens rough
    const excerpt = text.slice(0, MAX_CHARS);

    // 3) Summarize with OpenAI (concise, finance-oriented)
    const system =
      "You are a finance analyst. Summarize company financials for novice investors in clear bullet points. No investment advice.";
    const userPrompt =
      `Summarize the following report text into: (1) company/period, (2) key KPIs (revenue, EPS, margins, cash flow), (3) drivers & risks, ` +
      `(4) outlook/guidance, (5) 3–5 plain-language takeaways. Keep it under ~300–400 words.\n\n` +
      excerpt;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    });

    const summary =
      completion.choices?.[0]?.message?.content?.trim() || "(no summary)";

    res.json({
      ok: true,
      filename: req.file.originalname,
      chars: text.length,
      summary,
    });
  } catch (e) {
    console.error("summarize error:", e);
    res.status(500).json({ ok: false, error: "Summarization failed" });
  }
});

export default router;
