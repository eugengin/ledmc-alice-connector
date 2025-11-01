// api/lamp.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // ⚠️ Замените на ваш фронтенд URL
  const FRONTEND_URL = "https://ваш-сайт.vercel.app";

  res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = (body.message || "").trim();

    if (!text) return res.status(400).json({ ok: false, error: "Empty text" });
    if (text.length > 500) return res.status(400).json({ ok: false, error: "Text too long" });

    // Получаем ответ от OpenAI
    const reply = await getGPTReply(text);

    // Пробуем извлечь JSON из текста
    const lampData = extractJSON(reply) || { say: reply };

    return res.status(200).json({ ok: true, lamp: lampData });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// --- Вызов OpenAI ---
async function getGPTReply(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Отсутствует ключ OpenAI API");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Ты — голосовой мозг настольной лампы LED-MC (круглый диск, отражённый свет). Верни JSON: {\"say\":\"короткая фраза\",\"brightness\":0..100,\"hue\":0..360,\"mode\":\"warm|cool|evening|neutral|off|on\"}" },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 150
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Не смог получить ответ.";
}

// --- Вырезаем JSON из ответа ---
function extractJSON(s) {
  if (!s) return null;
  const fence = s.match(/```json([\s\S]*?)```/i);
  if (fence) s = fence[1];
  const i = s.indexOf('{'); const j = s.lastIndexOf('}');
  if (i >= 0 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  try { return JSON.parse(s.replace(/'/g,'"')); } catch {}
  return null;
}
