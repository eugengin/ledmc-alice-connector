// api/chat.js
// Серверless-эндпойнт Vercel для прокси к OpenAI Chat Completions.
// Работает на Node 18+. Поддерживает CORS и preflight.

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "*";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(req, res) {
  // Preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    res.setHeader("Vary", "Origin");
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  if (req.method !== "POST") {
    res.writeHead(405, { ...corsHeaders(), "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.writeHead(500, { ...corsHeaders(), "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "OPENAI_API_KEY not set" }));
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { messages = [], system = "You are a helpful assistant for LED-MC.", temperature = 0.5 } = body;

    // Проксируем в OpenAI Chat Completions
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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
      res.writeHead(r.status, { ...corsHeaders(), "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: data?.error || data }));
    }

    res.writeHead(200, { ...corsHeaders(), "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      model: data.model,
      reply: data.choices?.[0]?.message?.content || "",
      raw: data,
    }));
  } catch (err) {
    res.writeHead(500, { ...corsHeaders(), "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}
