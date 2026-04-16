/* Vercel Function: /api/chat
 * Web-standard Request/Response handler that proxies to Groq.
 * Keeps GROQ_API_KEY server-side.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set([DEFAULT_MODEL]);

const DEFAULT_RATE_LIMIT_MAX = 30; // requests
const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const ipBuckets = new Map();

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return null;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : null;
}

function getClientIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff && xff.trim()) return xff.split(",")[0].trim();
  const xrip = request.headers.get("x-real-ip");
  if (xrip && xrip.trim()) return xrip.trim();
  return "unknown";
}

function corsHeaders(request) {
  const origin = request.headers.get("origin");
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

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  const cleaned = [];
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string") continue;
    const content = m.content.trim();
    if (!content) continue;
    cleaned.push({ role: m.role, content: content.slice(0, 4000) });
  }

  return cleaned.slice(-24);
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

module.exports = {
  async fetch(request) {
    const cors = corsHeaders(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...cors, "Cache-Control": "no-store" } });
    }

    if (request.method !== "POST") {
      return json(405, { error: "Method Not Allowed" }, cors);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return json(500, { error: "Server is missing GROQ_API_KEY" }, cors);
    }

    const max = Number(process.env.RATE_LIMIT_MAX || DEFAULT_RATE_LIMIT_MAX);
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_RATE_LIMIT_WINDOW_MS);

    const ip = getClientIp(request);
    if (
      !rateLimitOk(
        ip,
        Number.isFinite(max) ? max : DEFAULT_RATE_LIMIT_MAX,
        Number.isFinite(windowMs) ? windowMs : DEFAULT_RATE_LIMIT_WINDOW_MS
      )
    ) {
      return json(429, { error: "Rate limit exceeded" }, cors);
    }

    let body;
    try {
      const buf = await request.arrayBuffer();
      if (buf.byteLength > 50 * 1024) return json(413, { error: "Payload too large" }, cors);
      const raw = new TextDecoder("utf-8").decode(buf);
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return json(400, { error: "Invalid request body" }, cors);
    }

    const model =
      typeof body.model === "string" && ALLOWED_MODELS.has(body.model.trim())
        ? body.model.trim()
        : DEFAULT_MODEL;

    const temperature =
      typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 1
        ? body.temperature
        : 0.45;

    const messages = sanitizeMessages(body.messages);
    if (!messages.length) {
      return json(400, { error: "No messages provided" }, cors);
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
      request.signal?.addEventListener?.(
        "abort",
        () => {
          controller.abort();
        },
        { once: true }
      );

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
        return json(502, { error: `Upstream ${upstream.status}`, detail: text || "" }, cors);
      }

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        return json(502, { error: "Upstream returned invalid JSON" }, cors);
      }

      const reply = data?.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || !reply.trim()) {
        return json(502, { error: "Upstream returned no message" }, cors);
      }

      return json(200, { reply: reply.trim() }, cors);
    } catch (err) {
      const aborted = err && (err.name === "AbortError" || err.code === "ABORT_ERR");
      return json(504, { error: aborted ? "Upstream timeout" : "Upstream request failed" }, cors);
    } finally {
      clearTimeout(timeout);
    }
  }
};
