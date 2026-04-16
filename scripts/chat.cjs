/* Serverless Chat Proxy (Vercel)
 * - Keeps GROQ_API_KEY on the server (never exposed to browser)
 * - Best-effort rate limiting + origin allowlist
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set([DEFAULT_MODEL]);

const DEFAULT_RATE_LIMIT_MAX = 30; // requests
const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const ipBuckets = new Map();

function json(res, statusCode, body, extraHeaders = {}) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(body));
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  const xrip = req.headers["x-real-ip"];
  if (typeof xrip === "string" && xrip.trim()) return xrip.trim();
  return "unknown";
}

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return null;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : null;
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  const allowed = parseAllowedOrigins();

  // If allowlist not configured, default to same-origin behavior (no wildcard).
  if (!allowed) {
    return {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
  }

  const originAllowed = typeof origin === "string" && allowed.includes(origin);
  return {
    ...(originAllowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function rateLimitOk(ip, max, windowMs) {
  const now = Date.now();
  const existing = ipBuckets.get(ip);
  if (!existing || now - existing.start >= windowMs) {
    ipBuckets.set(ip, { start: now, count: 1 });
    return true;
  }
  existing.count += 1;
  return existing.count <= max;
}

async function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("PAYLOAD_TOO_LARGE"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });

    req.on("error", () => reject(new Error("READ_ERROR")));
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  // Drop any user-provided system messages; enforce our own.
  const cleaned = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string") continue;
    const content = m.content.trim();
    if (!content) continue;
    cleaned.push({ role: m.role, content: content.slice(0, 4000) });
  }

  // Keep last 24 turns max.
  return cleaned.slice(-24);
}

module.exports = async (req, res) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    res.end();
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method Not Allowed" }, cors);
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    json(res, 500, { error: "Server is missing GROQ_API_KEY" }, cors);
    return;
  }

  const max = Number(process.env.RATE_LIMIT_MAX || DEFAULT_RATE_LIMIT_MAX);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS);

  const ip = getClientIp(req);
  if (!rateLimitOk(ip, Number.isFinite(max) ? max : DEFAULT_RATE_LIMIT_MAX, Number.isFinite(windowMs) ? windowMs : DEFAULT_RATE_LIMIT_WINDOW_MS)) {
    json(res, 429, { error: "Rate limit exceeded" }, cors);
    return;
  }

  let body;
  try {
    body = await readJsonBody(req, 50 * 1024);
  } catch (err) {
    const code = err && err.message;
    if (code === "PAYLOAD_TOO_LARGE") json(res, 413, { error: "Payload too large" }, cors);
    else json(res, 400, { error: "Invalid request body" }, cors);
    return;
  }

  const model = typeof body.model === "string" && ALLOWED_MODELS.has(body.model.trim()) ? body.model.trim() : DEFAULT_MODEL;
  const temperature = typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 1 ? body.temperature : 0.45;

  const messages = sanitizeMessages(body.messages);
  if (!messages.length) {
    json(res, 400, { error: "No messages provided" }, cors);
    return;
  }

  const upstreamPayload = {
    model,
    temperature,
    messages: [
      {
        role: "system",
        content:
          "You are the intake assistant for Rudrabha's biotech/healthtech portfolio. Keep responses concise, technical, and focused on scoping collaboration."
      },
      ...messages
    ]
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(upstreamPayload),
      signal: controller.signal
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      json(res, 502, { error: `Upstream ${upstream.status}`, detail: text || "" }, cors);
      return;
    }

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      json(res, 502, { error: "Upstream returned invalid JSON" }, cors);
      return;
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      json(res, 502, { error: "Upstream returned no message" }, cors);
      return;
    }

    json(res, 200, { reply: reply.trim() }, cors);
  } catch (err) {
    const aborted = err && (err.name === "AbortError" || err.code === "ABORT_ERR");
    json(res, 504, { error: aborted ? "Upstream timeout" : "Upstream request failed" }, cors);
  } finally {
    clearTimeout(timeout);
  }
};
