export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = (body.message || "").trim();
    if (!text) return res.status(400).json({ ok: false, error: "Empty text" });

    // === Подключение к OpenAI ===
    const reply = await getGPTReply(text);

    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

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
        { role: "system", content: "Ты — голосовой помощник LED-MC. Отвечай коротко, ясно и по сути." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Не смог получить ответ.";
}
