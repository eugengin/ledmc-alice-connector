// /api/chat.js  — минимальный рабочий ответ с полем `reply`
// ESM (package.json: "type": "module")

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Healthcheck
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, endpoint: "/api/chat", ts: new Date().toISOString() });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const text = (body.message || "").trim();

    if (!text) {
      return res.status(400).json({ ok: false, error: "Empty text" });
    }

    // <<< ВРЕМЕННЫЙ ЭХО-ОТВЕТ (для проверки цепочки) >>>
    // Здесь позже подключим OpenAI. Сейчас важно вернуть поле `reply`.
    let reply = `Принял: "${text}". Я на связи.`;

    // Примитивные правила для наглядности
    const t = text.toLowerCase();
    if (t.includes("включи") || t.includes("зажги")) reply = "Включаю лампу. Ореол стал ярче.";
    if (t.includes("выключи") || t.includes("потуши")) reply = "Выключаю лампу. Ореол погас.";
    if (t.includes("цвет") && (t.includes("зел") || t.includes("green"))) reply = "Меняю цвет ореола на зелёный.";
    if (t.includes("цвет") && (t.includes("жёл") || t.includes("желт") || t.includes("yellow"))) reply = "Меняю цвет ореола на жёлтый.";

    return res.status(200).json({
      ok: true,
      deviceId: body.deviceId || "unknown",
      reply
    });

  } catch (err) {
    return res.status(500).json({ ok: false, error: "Server error", detail: String(err) });
  }
}
