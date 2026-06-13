/* Vercel Function: /api/chat
 * Web-standard Request/Response handler that proxies to Groq.
 * Keeps GROQ_API_KEY server-side.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set([DEFAULT_MODEL]);

// Knowledge base + persona for the portfolio intake assistant.
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
          content: SYSTEM_PROMPT
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
