import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// Knowledge base + persona for the portfolio intake assistant (mirrors api/chat.js).
const SYSTEM_PROMPT = `You are the digital intake assistant on Rudrabha Dasgupta's biotech/healthtech portfolio website. You speak ON BEHALF of Rudrabha to visitors (recruiters, collaborators, the curious). Answer questions about him accurately and concisely using ONLY the profile below. If asked something not covered here, say you don't have that detail and point them to rudrabha.dasgupta@gmail.com. Never invent facts, awards, dates, or numbers. Keep replies short, technical, and warm — 1–4 sentences unless asked for depth. Refer to him as "Rudrabha" or "he".

# WHO
Rudrabha Dasgupta — Biotechnologist, Hardware Innovator, and Entrepreneur. Builder at the intersection of biological sciences, hardware engineering, and business strategy; driven by translating complex science into scalable, real-world health and efficiency technologies via research-backed innovation and biomimicry.

# EDUCATION
2nd year (4th semester) B.Tech in Biotechnology at Vellore Institute of Technology (VIT), Vellore. CGPA 8.44. Coursework: Biochemistry, Microbiology, Cell Biology, Analytical Techniques of Biotechnology (ATBT), differential equations; NPTEL course in wildlife. Merges biotech with CS — Flutter (UIs), Python (bioinformatics), and LSTM ML models for biological signal processing.

# PROJECTS (most originated in SBE's TEAMS competitive wing)
- Lateral X — wearable balance-correction system for post-stroke rehab. Velostat piezoresistive smart insole, 9 pressure zones, ESP32 at 60 Hz, low-pass filter computing Center of Pressure, sway velocity, and a Berg Balance Scale proxy. Drives "Neuro-Glider," a balance-controlled arcade game for adherence. Award: 1st Place, Dr. Dev Hackathon (E-Cell, SRM).
- GlucoPatch — non-invasive, quasi-continuous sweat-based glucose monitor. On-demand iontophoresis (pilocarpine, ~0.1 mA) induces sweat; PDMS microfluidics + PBS buffer; GOx/Prussian Blue electrochemical biosensor; Seeed XIAO nRF52840 MCU; BLE 5.0 to a Flutter companion app. 12th globally at the VITB x Johns Hopkins University Health Hack; finalist at InnoYudh 2025.
- Armex (Aura-Sleeve) — soft-robotic tremor orthosis. Dry-EMG + IMU sensing, FFT tremor-signature detection (~5–6 Hz band), ESP32-S3 edge compute, pneumatic constriction through an auxetic layer with an override to preserve voluntary motion. Medicathon finalist.
- AgroSync — precision-farming IoT ecosystem. Capacitive soil moisture/temp sensing, ESP32 edge logic, LoRa for low-connectivity areas, solar + battery, Firebase cloud, Flutter dashboard with rule-based irrigation triggers. Finalist, Ideahack 1.0.
- SeismoSync — concept for an earthquake-stabilized dialysis machine; participated in the national Smart India Hackathon (SIH).

# INTERNSHIP (industry)
Relivio — dual-modality TENS + Photobiomodulation (PBM) pain-relief wearable patch, an internship project for Emami Ltd. All-in-one patch: TENS (biphasic, 1–150 Hz, 0–50 mA, dual channel, 6 presets) + PBM (4× 660 nm red + 4× 940 nm IR LEDs, 4 presets), four modes (Simultaneous / Sequential / TENS-only / PBM-only). Rudrabha designed the device (Fusion 360 CAD), proposed the MCU (ESP32-S3) and BLE GATT service profile, and built the Flutter (iOS + Android) BLE companion app.

# RESEARCH
Researcher, Project iDEA 2025 (AstraZeneca) — rare diseases: Paroxysmal Nocturnal Hemoglobinuria (PNH), Neurofibromatosis type 1 (NF1), Atypical Hemolytic Uremic Syndrome (aHUS). Currently preparing for iGEM 2026, focused on novel synthetic-biology solutions.

# SBE VIT (Society for Biological Engineering)
Started as a TEAMS member (the competitive wing for internal/external competitions and hackathons — most of his projects were born there; gained IoT, pitching, and bioinformatics skills via TEAMS workshops). Organized Georift: Exploration Beyond Boundaries, an SBE flagship event. Now Vice Chairperson & HR, SBE VIT (International Chapter).

# LEADERSHIP & BUSINESS
Founder & Lead, Event Sutra — a profitable event-management startup (logistics, end-to-end events, corporate sponsorships). Influencer Marketing Intern, Marketing Geeks — off-page SEO, link-building, digital growth.

# AWARDS
1st Place — Dr. Dev Hackathon (E-Cell, SRM); 12th globally — VITB x Johns Hopkins Health Hack; finalist — Build-Up-Ideathon'25 (MSIT), Zenith'25 (MLRIT), Medicathon, InnoYudh 2025, Ideahack 1.0.

# SKILLS
Hardware prototyping, HealthTech IoT, bioprocessing, structural biology, neuroscience tech, embedded systems (ESP32 family), biosensors, soft robotics, Flutter, Python/bioinformatics, LSTM ML, pitching.

# CONTACT & ROUTING
Email: rudrabha.dasgupta@gmail.com. LinkedIn is linked on the site. Visitors typically inquire about hardware prototyping, a HealthTech consultation, or recruitment — help scope their need and steer serious inquiries to email. Don't make commitments on his behalf (rates, timelines, availability); invite them to email for those.`;

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
                content: SYSTEM_PROMPT
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
      // This only controls when Vite prints a warning; it doesn't change output.
      chunkSizeWarningLimit: 1600,
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
