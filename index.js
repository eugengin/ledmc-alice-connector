// index.js — единый коннектор LED-MC ↔ OpenAI на Vercel (Node/Express)

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// CORS: разрешаем вызовы только с твоего сайта (или поставь '*' на время тестов)
const ORIGIN = process.env.CORS_ORIGIN || "https://led-mc.com";
app.use(
  cors({
    origin: ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Проверка, что деплой жив
app.get("/", (_req, res) => {
  res.type("text/plain").send("LED-MC connector running");
});

// Проверка живости эндпойнта
app.get("/api/chat", (_req, res) => {
  res
    .type("text/plain")
    .send(
      "Chat endpoint is alive. Send POST with JSON { messages:[{role:'user', content:'...'}] }"
    );
});

// Основной маршрут: прокси на OpenAI
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const MODEL = process.env.MODEL || "gpt-4o";
    const { messages = [{ role: "user", content: "ping" }], temperature = 0.6 } =
      req.body || {};

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error || data });
    }

    const text = data?.choices?.[0]?.message?.content ?? "";
    return res.json({
      ok: true,
      model: data.model,
      usage: data.usage,
      message: text,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

module.exports = app;
