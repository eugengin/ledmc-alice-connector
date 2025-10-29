// Serverless-функция: /api/chat
export default async function handler(req, res) {
  // CORS (чтобы можно было стучаться со страниц сайта)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Быстрый “пинг” в браузере: доказывает, что эндпоинт жив
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      endpoint: "/api/chat",
      ts: new Date().toISOString()
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Пример: эхо-обработчик. Сюда потом добавим логику лампы и вызов GPT.
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { command = "ping", payload = {} } = body;

    // Заглушка «логики» — вернём управляемый ответ
    return res.status(200).json({
      ok: true,
      mode: "demo",
      received: { command, payload },
      next: {
        lamp_action: "set_mode",
        params: { mode: "breathe", brightness: 0.6, color: "#F7C948" }
      }
    });
  } catch (e) {
    return res.status(400).json({ ok: false, error: String(e) });
  }
}
