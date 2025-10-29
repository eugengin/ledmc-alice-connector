// api/chat.js — LED-MC Voice Bridge (ESM)

import fetch from "node-fetch";

/** CORS helper */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(res);

  // Preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // Health check in browser
  if (req.method === "GET") {
    res
      .status(200)
      .json({ ok: true, endpoint: "/api/chat", ts: new Date().toISOString() });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const text = String(body.text || "").trim();

    if (!text) {
      res.status(400).json({ ok: false, error: "Empty text" });
      return;
    }

    // --- простая локальная разметка команд для лампы (не мешает диалогу) ---
    const lamp_action = detectLampAction(text);

    // --- вызов OpenAI (чат-ответ для пользователя) ---
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      // Без ключа всё равно отвечаем, чтобы мост тестировался
      return res.status(200).json({
        ok: true,
        reply: "Мост активен. Добавь OPENAI_API_KEY в переменные окружения Vercel.",
        lamp_action
      });
    }

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Ты — голосовой ассистент для владельцев лампы LED-MC. Отвечай кратко и по делу. " +
              "Если пользователь просит изменить свет, можешь дополнить ответ советом, " +
              "но решение по свету уже вычисляет сервер и отдаёт в поле lamp_action.",
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!openaiResp.ok) {
      const err = await safeJson(openaiResp);
      res.status(502).json({ ok: false, error: "OpenAI error", detail: err });
      return;
    }

    const data = await openaiResp.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Я на связи. Скажи, что нужно.";

    res.status(200).json({ ok: true, reply, lamp_action });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error", detail: String(e) });
  }
}

// --------- Утилиты ---------

function safeJson(resp) {
  return resp
    .json()
    .catch(async () => ({ status: resp.status, text: await resp.text() }));
}

/** Грубое распознавание фраз для управления диском */
function detectLampAction(text) {
  const t = text.toLowerCase();

  // вкл/выкл
  if (/\b(выключи|off|потуши)\b/.test(t)) {
    return { action: "power", params: { on: false } };
  }
  if (/\b(включи|on|зажги)\b/.test(t)) {
    return { action: "power", params: { on: true } };
  }

  // яркость: проценты
  const pct = t.match(/(\d{1,3})\s*%/);
  if (pct) {
    let v = Math.max(0, Math.min(100, parseInt(pct[1], 10)));
    return { action: "brightness", params: { value: v } };
  }

  // режим «дыхание»
  if (/(дыхани|пульс|breath|pulse)/.test(t)) {
    return { action: "mode", params: { name: "breathe", speed: 1.0 } };
  }

  // цвет по ключевым словам
  const hueMap = {
    красн: 0,
    оранж: 30,
    янтар: 45,
    желт: 55,
    лайм: 75,
    зелён: 120,
    зелен: 120,
    бирюз: 165,
    голуб: 200,
    синий: 220,
    фиолет: 275,
    пурпур: 300,
    розов: 330,
    white: 0, // пусть фронт интерпретирует как нейтральный
    бел: 0,
    warm: 40,
    cold: 210
  };
  for (const key of Object.keys(hueMap)) {
    if (t.includes(key)) {
      return { action: "color", params: { hue: hueMap[key] } };
    }
  }

  return null; // нет команды — просто диалог
}
