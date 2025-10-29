// index.js — для локальной проверки
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages || [];
    const temperature = req.body.temperature ?? 0.5;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.MODEL || "gpt-4o-mini",
        messages,
        temperature
      })
    });

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content ?? "Нет ответа.";
    res.json({ message: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("✅ Server ready on http://localhost:3000"));
