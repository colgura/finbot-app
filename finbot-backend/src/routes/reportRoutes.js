import express from "express";
import multer from "multer";
import pdfParse from "../compat/pdf-parse.cjs";
import OpenAI from "openai";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/ping", (_req, res) =>
  res.json({ ok: true, where: "reportRoutes" })
);

router.post("/summary", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    if (!/\.pdf$/i.test(req.file.originalname)) {
      return res.status(400).json({ error: "Please upload a PDF" });
    }

    const parsed = await pdfParse(req.file.buffer);
    const pages = parsed.numpages || 0;
    const fullText = (parsed.text || "").trim();
    const textPreview = fullText.slice(0, 4000);

    let summary = null;
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful financial summarizer.",
          },
          {
            role: "user",
            content:
              "Summarize the following financial report text in 6–8 bullet points, plain language, no advice:\n\n" +
              textPreview,
          },
        ],
      });
      summary = resp.choices?.[0]?.message?.content?.trim() || null;
    }

    res.json({
      ok: true,
      pages,
      bytes: req.file.size,
      filename: req.file.originalname,
      textPreview,
      summary,
    });
  } catch (err) {
    console.error("pdf summary error:", err);
    res.status(500).json({ error: "Failed to parse/summarize PDF" });
  }
});

export default router;
