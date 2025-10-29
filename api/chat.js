// api/chat.js
// Серверless-функция для общения с OpenAI API
import fetch from "node-fetch";
import cors from "cors";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];
    const temperature = body.temperature ?? 0.5;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.MODEL || "gpt-4o-mini",
        messages,
        temperature
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      res.status(openaiResponse.status).json(data);
      return;
    }

    const text = data.choices?.[0]?.message?.content ?? "Нет ответа.";
    res.status(200).json({ message: text });
  } catch (error) {
    res.status(500).json({ error: error.message || String(error) });
  }
}
