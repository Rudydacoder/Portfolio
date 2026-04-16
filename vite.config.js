import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const groqApiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY || "";
  const allowedOriginsRaw = env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || "";
  const allowedOrigins = allowedOriginsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const localChatApiPlugin = {
    name: "local-chat-api",
    configureServer(server) {
      server.middlewares.use("/api/chat", async (req, res, next) => {
        const origin = req.headers.origin;
        const originAllowed =
          !allowedOrigins.length || (typeof origin === "string" && allowedOrigins.includes(origin));

        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        res.setHeader("Vary", "Origin");
        if (originAllowed && typeof origin === "string") {
          res.setHeader("Access-Control-Allow-Origin", origin);
        }

        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }

        if (!groqApiKey.trim()) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Missing GROQ_API_KEY for local /api/chat" }));
          return;
        }

        try {
          let raw = "";
          await new Promise((resolveBody, rejectBody) => {
            req.on("data", (chunk) => {
              raw += chunk;
              if (raw.length > 50 * 1024) {
                rejectBody(new Error("PAYLOAD_TOO_LARGE"));
                req.destroy();
              }
            });
            req.on("end", resolveBody);
            req.on("error", rejectBody);
          });

          const body = raw ? JSON.parse(raw) : {};
          const model = typeof body.model === "string" ? body.model.trim() : DEFAULT_MODEL;
          const temperature =
            typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 1
              ? body.temperature
              : 0.45;

          const messages = sanitizeMessages(body.messages);
          if (!messages.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "No messages provided" }));
            return;
          }

          const upstreamPayload = {
            model: model || DEFAULT_MODEL,
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

          const upstream = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey.trim()}`
            },
            body: JSON.stringify(upstreamPayload)
          });

          const text = await upstream.text();
          if (!upstream.ok) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: `Upstream ${upstream.status}`, detail: text || "" }));
            return;
          }

          const data = text ? JSON.parse(text) : {};
          const reply = data?.choices?.[0]?.message?.content;
          if (typeof reply !== "string" || !reply.trim()) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ error: "Upstream returned no message" }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ reply: reply.trim() }));
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          const status = code === "PAYLOAD_TOO_LARGE" ? 413 : 400;
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: status === 413 ? "Payload too large" : "Bad request" }));
        }
      });
    }
  };

  return {
    plugins: [react(), localChatApiPlugin],
    build: {
      rollupOptions: {
        input: {
          main: resolve(process.cwd(), "index.html"),
          lateralX: resolve(process.cwd(), "lateral-x-showcase.html"),
          glucoPatch: resolve(process.cwd(), "glucopatch_simulation.html"),
          auraSleeve: resolve(process.cwd(), "aura-sleeve.html"),
          agroSync: resolve(process.cwd(), "agrosync.html"),
          about: resolve(process.cwd(), "about.html")
        }
      }
    }
  };
});
