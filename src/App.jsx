import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import emailjs from "@emailjs/browser";
import SignalWaveBackground from "./SignalWaveBackground";
import ConversationTerminal from "./ConversationTerminal";

const cardTransition = { duration: 0.58, ease: [0.22, 1, 0.36, 1] };
const interactiveCursorSelector = "h1, h2, h3, h4, button, a, .project-card, .cursor-hover";

const projects = [
  {
    id: "card-lateralx",
    index: "01",
    colClass: "lg:col-span-3",
    image: "/LateralX.png",
    imageAlt: "High-fidelity 3D render of a futuristic wearable medical band sensor on a dark background",
    tag: "Hardware",
    title: "Lateral X",
    badge: "1st Place - Dr. Dev Hackathon",
    description: "Advanced wearable balance correction system designed for post-stroke rehabilitation and active stabilization.",
    xray: "CALIBRATING GYROSCOPE... | NEURAL INHIBITION: DETECTED | STABILIZATION ALGORITHM: DEPLOYED...",
    href: "./lateral-x-showcase.html"
  },
  {
    id: "card-glucopatch",
    index: "02",
    colClass: "lg:col-span-2",
    image: "/glucopatch-bg.png",
    imageAlt: "Clean mockup of a modern mobile app dashboard next to a small biometric sensor",
    tag: "Ecosystem",
    title: "GlucoPatch Ecosystem",
    badge: "12th Place - Health Hack",
    description: "Non-invasive continuous glucose monitoring platform connecting patient sensors to clinical dashboards.",
    xray: "CONNECTING SENSOR... | BLOOD GLUCOSE: 105 MG/DL | TREND: STABLE | SYNCING DASHBOARD...",
    href: "./glucopatch_simulation.html"
  },
  {
    id: "card-armex",
    index: "03",
    colClass: "lg:col-span-2",
    image: "/Armex.png",
    imageAlt: "Armex soft-robotic tremor-restricting smart sleeve",
    tag: "Soft-Robotics",
    title: "Armex",
    badge: "Medicathon finalist",
    description: "Tremor restricting Smart sleeves.",
    xray: "INITIALIZING STABILIZATION PROTOCOL... | WET LAB PARAMS: NORMAL | DRY LAB ALGORITHMS: ACTIVE...",
    href: "./aura-sleeve.html"
  },
  {
    id: "card-agrosync",
    index: "04",
    colClass: "lg:col-span-3",
    image: "/AgroSync.png",
    imageAlt: "AgroSync data-driven agricultural synchronization platform visualization",
    tag: "AgriTech",
    title: "AgroSync",
    badge: "Idea Hack 1.0 Winner",
    description: "Data-driven agricultural synchronization platform.",
    xray: "ANALYZING SOIL MOISTURE... | SATELLITE IMAGERY: SYNCED | YIELD PREDICTION: OPTIMAL...",
    href: "./agrosync.html"
  }
];

const capabilities = [
  { label: "Bioprocessing", image: "/Bioprocessing.webp" },
  { label: "HealthTech IoT", image: "/HealthTech IOT.webp" },
  { label: "Hardware Prototyping", image: "/Hardware.jpg" },
  { label: "Structural Biology", image: "/blue-molecules-molecule-structure-d-illustration-60754008.webp" },
  { label: "Neuroscience Tech", image: "/Neuroscience Tech.webp" }
];

function Counter({ target, suffix = "", label }) {
  const [inView, setInView] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let frame = 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return (
    <motion.div
      className="text-center md:text-left"
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, amount: 0.7 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="display-serif text-ink text-5xl md:text-7xl leading-none">
        {value}
        <span className="text-cobalt">{suffix}</span>
      </div>
      <p className="font-mono text-[11px] text-ink-soft mt-3 uppercase tracking-[0.22em]">{label}</p>
    </motion.div>
  );
}

const relivioShots = [
  { src: "/relivio-1.png", label: "Three-quarter" },
  { src: "/relivio-2.png", label: "Top-down" }
];

function RelivioTurntable({ reduceMotion }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reduceMotion) return;
    const id = setInterval(() => setActive((a) => (a + 1) % relivioShots.length), 2600);
    return () => clearInterval(id);
  }, [auto, reduceMotion]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-ink bg-[#0E1116] shadow-[12px_12px_0_rgba(22,21,15,0.85)]">
      <div className="absolute top-3 left-3 z-20 font-mono text-[9px] tracking-[0.2em] uppercase text-paper/55 bg-[#0E1116]/65 border border-[#5468FF]/25 rounded-full px-3 py-1.5 backdrop-blur-sm">
        Relivio · CAD Model
      </div>
      <div className="absolute top-3 right-3 z-20 font-mono text-[9px] tracking-[0.2em] uppercase text-paper/55 bg-[#0E1116]/65 border border-[#5468FF]/25 rounded-full px-3 py-1.5 backdrop-blur-sm">
        Fusion 360
      </div>

      <div className="relative aspect-[4/3] w-full">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 50% 62%, rgba(84,104,255,0.20), transparent 62%)" }}
        />
        {relivioShots.map((shot, i) => (
          <img
            key={shot.src}
            src={shot.src}
            alt={`Relivio TENS+PBM device — ${shot.label} view`}
            className="absolute inset-0 w-full h-full object-contain p-10 transition-opacity duration-700"
            style={{ opacity: active === i ? 1 : 0 }}
            draggable={false}
          />
        ))}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 font-mono text-[9px] tracking-[0.2em] uppercase text-[#8FA0FF]">
          {relivioShots[active].label} view
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {relivioShots.map((shot, i) => (
          <button
            key={shot.src}
            type="button"
            onClick={() => {
              setActive(i);
              setAuto(false);
            }}
            aria-label={`Show ${shot.label} view`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              active === i ? "w-7 bg-[#5468FF]" : "w-2.5 bg-paper/30 hover:bg-paper/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [motionProfile, setMotionProfile] = useState({ reduced: false, coarse: false });
  const [cursorMode, setCursorMode] = useState("default");
  const [trailer, setTrailer] = useState({ visible: false, image: "", label: "" });
  const [isWorkMenuOpen, setIsWorkMenuOpen] = useState(false);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState({ fromEmail: "", subject: "", body: "", attachments: [] });
  const [composeStatus, setComposeStatus] = useState({ type: "idle", message: "" });
  const [isSending, setIsSending] = useState(false);
  const composeFormRef = useRef(null);
  const composeFileRef = useRef(null);
  const workMenuRef = useRef(null);
  const contactMenuRef = useRef(null);
  const scrollRafRef = useRef(0);
  const scrollProgressRef = useRef(0);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorScale = useMotionValue(1);
  const cursorStretch = useMotionValue(0);
  const cursorAngle = useMotionValue(0);
  const trailerX = useMotionValue(-200);
  const trailerY = useMotionValue(-200);
  const smoothCursorX = useSpring(cursorX, { stiffness: 420, damping: 38, mass: 0.35 });
  const smoothCursorY = useSpring(cursorY, { stiffness: 420, damping: 38, mass: 0.35 });
  const smoothCursorStretch = useSpring(cursorStretch, { stiffness: 300, damping: 28, mass: 0.25 });
  const smoothCursorAngle = useSpring(cursorAngle, { stiffness: 260, damping: 34, mass: 0.25 });
  const smoothTrailerX = useSpring(trailerX, { stiffness: 220, damping: 30, mass: 0.45 });
  const smoothTrailerY = useSpring(trailerY, { stiffness: 220, damping: 30, mass: 0.45 });
  const cursorScaleX = useTransform([cursorScale, smoothCursorStretch], ([scale, stretch]) => scale + stretch);
  const cursorScaleY = useTransform([cursorScale, smoothCursorStretch], ([scale, stretch]) => scale - stretch * 0.8);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) || null,
    [selectedId]
  );

  const contactEmail = "rudrabha.dasgupta@gmail.com";
  const linkedInUrl = "https://www.linkedin.com/in/rudrabha-dasgupta-10409b326/";

  const scrollToSelectedWork = () => {
    const el = document.getElementById("selected-work");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToProjectCard = (projectId) => {
    const el = document.getElementById(`project-${projectId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const emailJsServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const emailJsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const emailJsPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const emailJsReady = Boolean(emailJsServiceId && emailJsTemplateId && emailJsPublicKey);

  const canSendEmail = useMemo(() => {
    const from = composeDraft.fromEmail.trim();
    const fromOk = from.includes("@") && from.includes(".");
    const subjectOk = composeDraft.subject.trim().length > 0;
    const bodyOk = composeDraft.body.trim().length > 0;
    return fromOk && subjectOk && bodyOk && emailJsReady && !isSending;
  }, [composeDraft.body, composeDraft.fromEmail, composeDraft.subject, emailJsReady, isSending]);

  useEffect(() => {
    if (!showPreloader) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showPreloader]);

  // Hide the preloader only once styles/fonts and the page itself have loaded
  // (min 1.2s so the intro reads; 6s safety cap so it can never hang).
  useEffect(() => {
    let cancelled = false;

    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
    const pageLoaded = new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const safetyCap = new Promise((resolve) => setTimeout(resolve, 6000));

    Promise.race([Promise.all([minDelay, pageLoaded, fontsReady]), safetyCap]).then(() => {
      if (!cancelled) setShowPreloader(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const sendDirectEmail = async () => {
    if (!emailJsReady) {
      setComposeStatus({ type: "error", message: "Email is not configured yet. Set VITE_EMAILJS_* env vars." });
      return;
    }
    if (!canSendEmail) return;
    if (!composeFormRef.current) return;

    try {
      setIsSending(true);
      setComposeStatus({ type: "sending", message: "Sending…" });

      await emailjs.sendForm(emailJsServiceId, emailJsTemplateId, composeFormRef.current, {
        publicKey: emailJsPublicKey
      });

      setComposeStatus({ type: "success", message: "Sent." });
      setComposeDraft({ fromEmail: "", subject: "", body: "", attachments: [] });
      if (composeFileRef.current) composeFileRef.current.value = "";
      setTimeout(() => setComposeStatus({ type: "idle", message: "" }), 1800);
      setTimeout(() => setIsComposeOpen(false), 700);
    } catch (error) {
      const details =
        typeof error?.text === "string"
          ? error.text
          : typeof error?.message === "string"
            ? error.message
            : "";

      setComposeStatus({
        type: "error",
        message: details ? `Send failed: ${details}` : "Send failed. Please try again."
      });
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setIsWorkMenuOpen(false);
      setIsContactMenuOpen(false);
      setIsComposeOpen(false);
    };

    const onPointerDown = (event) => {
      const target = event.target;
      if (isWorkMenuOpen && workMenuRef.current && !workMenuRef.current.contains(target)) {
        setIsWorkMenuOpen(false);
      }
      if (isContactMenuOpen && contactMenuRef.current && !contactMenuRef.current.contains(target)) {
        setIsContactMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isContactMenuOpen, isWorkMenuOpen]);

  useEffect(() => {
    const reduceMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMedia = window.matchMedia("(pointer: coarse)");
    const updateProfile = () => {
      setMotionProfile({ reduced: reduceMedia.matches, coarse: coarseMedia.matches });
    };

    updateProfile();
    reduceMedia.addEventListener("change", updateProfile);
    coarseMedia.addEventListener("change", updateProfile);

    return () => {
      reduceMedia.removeEventListener("change", updateProfile);
      coarseMedia.removeEventListener("change", updateProfile);
    };
  }, []);

  useEffect(() => {
    const enableCursor = !motionProfile.coarse && !motionProfile.reduced && !isTerminalOpen;
    document.body.classList.toggle("js-cursor-ready", enableCursor);

    const last = { x: -100, y: -100, t: performance.now() };

    const onMove = (event) => {
      const now = performance.now();
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      const dt = Math.max(now - last.t, 16);
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;
      const stretch = Math.min(speed * (motionProfile.reduced ? 0.8 : 1.2), motionProfile.reduced ? 0.2 : 0.28);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      last.x = event.clientX;
      last.y = event.clientY;
      last.t = now;
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
      cursorStretch.set(stretch);
      cursorAngle.set(angle);
      trailerX.set(event.clientX);
      trailerY.set(event.clientY);
    };

    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const next = total <= 0 ? 0 : (window.scrollY / total) * 100;
        if (Math.abs(next - scrollProgressRef.current) >= 0.5 || next === 0 || next === 100) {
          scrollProgressRef.current = next;
          setScrollProgress(next);
        }
        scrollRafRef.current = 0;
      });
    };

    const onPointerOver = (event) => {
      const entered = event.target.closest(interactiveCursorSelector);
      const related = event.relatedTarget?.closest?.(interactiveCursorSelector);
      if (entered && entered !== related) {
        cursorScale.set(motionProfile.reduced ? 1.8 : 2.4);
        setCursorMode("interactive");
      }
    };

    const onPointerOut = (event) => {
      const left = event.target.closest(interactiveCursorSelector);
      const related = event.relatedTarget?.closest?.(interactiveCursorSelector);
      if (left && !related) {
        cursorScale.set(1);
        setCursorMode("default");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    if (enableCursor) {
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseover", onPointerOver);
      document.addEventListener("mouseout", onPointerOut);
    }
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
      if (enableCursor) {
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseover", onPointerOver);
        document.removeEventListener("mouseout", onPointerOut);
      }
      document.body.classList.remove("js-cursor-ready");
    };
  }, [motionProfile.coarse, motionProfile.reduced, isTerminalOpen]);

  const reduceMotion = motionProfile.reduced;
  const enableCursor = !motionProfile.coarse && !reduceMotion && !isTerminalOpen;
  const revealMotion = reduceMotion
    ? {
        initial: false,
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0 },
        transition: { duration: 0.2 }
      }
    : {
        initial: { opacity: 0, y: 36 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.06 },
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      };

  return (
    <>
      <SignalWaveBackground />
      <ConversationTerminal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />
      <AnimatePresence>
        {showPreloader ? (
          <motion.div
            key="preloader"
            id="preloader"
            className="fixed inset-0 z-[999] flex items-center justify-center"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="preloader-stack">
              <div className="overflow-hidden">
                <motion.span
                  id="preloader-text"
                  className="inline-block"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.7 }}
                >
                  Rudrabha <em>Dasgupta</em>
                </motion.span>
              </div>
              <div className="preloader-bar" aria-hidden="true">
                <span className="preloader-bar__fill" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        id="scroll-progress"
        className="fixed top-0 left-0 h-[3px] z-[999] pointer-events-none"
        style={{
          width: `${scrollProgress}%`,
          background: "linear-gradient(90deg, #2B3FF2, #FF4D21)"
        }}
      />

      {enableCursor ? (
        <motion.div
          id="trailing-image"
          className="fixed top-0 left-0 w-48 h-32 rounded-md bg-card border border-ink/80 pointer-events-none z-[110] overflow-hidden flex items-center justify-center shadow-[6px_6px_0_rgba(22,21,15,0.85)]"
          style={{ x: smoothTrailerX, y: smoothTrailerY }}
          animate={{
            xPercent: -50,
            yPercent: -50,
            opacity: trailer.visible ? 1 : 0,
            scale: trailer.visible ? 1 : 0.7,
            rotate: trailer.visible ? -2 : 0
          }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
        >
          {trailer.image ? (
            <img src={trailer.image} alt={trailer.label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-ink-soft text-xs font-mono">[ CAPABILITY VISUAL ]</span>
          )}
        </motion.div>
      ) : null}

      {enableCursor ? (
        <motion.div
          id="custom-cursor"
          className={`fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-[120] ${cursorMode === "interactive" ? "bg-cobalt/90" : "bg-ink"}`}
          style={{
            x: smoothCursorX,
            y: smoothCursorY,
            xPercent: -50,
            yPercent: -50,
            scaleX: cursorScaleX,
            scaleY: cursorScaleY,
            rotate: smoothCursorAngle
          }}
        />
      ) : null}

      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 w-full max-w-[1920px] mx-auto mix-blend-difference text-white"
        initial={reduceMotion ? false : { y: -28, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[22px]">grid_view</span>
          <span className="font-mono text-xs font-bold tracking-[0.18em]">RUDRABHA DASGUPTA | INNOVATOR</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="relative" ref={workMenuRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] hover:opacity-60 transition-opacity"
              aria-haspopup="menu"
              aria-expanded={isWorkMenuOpen}
              onClick={() => {
                setIsWorkMenuOpen((open) => !open);
                setIsContactMenuOpen(false);
              }}
            >
              SELECTED WORK <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>

            {isWorkMenuOpen ? (
              <div
                className="mix-blend-normal absolute right-0 mt-3 w-80 rounded-xl border border-ink bg-card shadow-[8px_8px_0_rgba(22,21,15,0.85)] overflow-hidden text-ink"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-ink/10">
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint">Projects</p>
                </div>
                <div className="py-1">
                  {projects.map((project) => (
                    <button
                      key={`menu-${project.id}`}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-cobalt/10 transition-colors group"
                      role="menuitem"
                      onClick={() => {
                        scrollToSelectedWork();
                        setTimeout(() => scrollToProjectCard(project.id), 250);
                        setIsWorkMenuOpen(false);
                      }}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] text-cobalt">{project.index}</span>
                        <span className="display-serif text-ink text-lg leading-tight group-hover:text-cobalt transition-colors">{project.title}</span>
                      </div>
                      <div className="font-mono text-[10px] mt-1 uppercase tracking-[0.18em] text-ink-faint pl-7">{project.tag}</div>
                    </button>
                  ))}
                  <div className="h-px bg-ink/10 my-1" />
                  <div className="px-4 py-3 font-mono text-[11px] text-ink-faint">More to be added</div>
                </div>
              </div>
            ) : null}
          </div>

          <a className="font-mono text-xs tracking-[0.14em] hover:opacity-60 transition-opacity" href="./about.html">ABOUT</a>

          <div className="relative" ref={contactMenuRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] hover:opacity-60 transition-opacity"
              aria-haspopup="menu"
              aria-expanded={isContactMenuOpen}
              onClick={() => {
                setIsContactMenuOpen((open) => !open);
                setIsWorkMenuOpen(false);
              }}
            >
              CONTACT <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>

            {isContactMenuOpen ? (
              <div
                className="mix-blend-normal absolute right-0 mt-3 w-80 rounded-xl border border-ink bg-card shadow-[8px_8px_0_rgba(22,21,15,0.85)] overflow-hidden text-ink"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-ink/10">
                  <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint">Reach out</p>
                </div>
                <div className="py-1">
                  <a
                    className="block px-4 py-3 hover:bg-cobalt/10 transition-colors"
                    href={`mailto:${contactEmail}`}
                    role="menuitem"
                  >
                    <div className="text-ink text-sm font-semibold leading-tight">Email</div>
                    <div className="font-mono text-[11px] mt-1 text-ink-faint">{contactEmail}</div>
                  </a>
                  <a
                    className="block px-4 py-3 hover:bg-cobalt/10 transition-colors"
                    href={linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                  >
                    <div className="text-ink text-sm font-semibold leading-tight">LinkedIn</div>
                    <div className="font-mono text-[11px] mt-1 text-ink-faint">Open profile</div>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 main-content">
        <section className="relative min-h-screen w-full flex items-center overflow-hidden">
          <div className="relative z-20 w-full max-w-[1920px] mx-auto px-6 md:pl-[10%] md:pr-10 grid grid-cols-1 md:grid-cols-12 h-full">
            <div className="md:col-span-9 flex flex-col justify-center gap-12 pt-24 md:pt-0">
              <div className="space-y-8">
                <motion.div
                  className="micro-label"
                  initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  Biotechnologist · Hardware Innovator · Entrepreneur
                </motion.div>
                <div className="overflow-hidden">
                  <motion.h1
                    id="hero-headline"
                    className="display-serif text-ink text-6xl md:text-8xl lg:text-[120px] leading-[0.95]"
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.9 }}
                  >
                    Building systems<br />that <span className="matter-glow">matter</span>.
                  </motion.h1>
                </div>
                <motion.p
                  className="text-ink-soft text-lg md:text-2xl font-normal leading-[1.6] max-w-2xl"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.15 }}
                >
                  From wearable balance correction to non-invasive diagnostic ecosystems. I design, code, and consult on projects that bridge human need with flawless technical execution.
                </motion.p>
              </div>
              <motion.div
                className="flex items-center gap-6"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.28 }}
              >
                <button
                  type="button"
                  onClick={() => setIsTerminalOpen(true)}
                  className="btn-pill btn-pill--solid h-14 px-8 text-base animate-glow-pulse"
                >
                  Know About Me <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
                </button>
                <button
                  type="button"
                  onClick={scrollToSelectedWork}
                  className="font-mono text-xs tracking-[0.18em] uppercase text-ink-soft hover:text-cobalt transition-colors inline-flex items-center gap-2"
                >
                  See the work <span className="material-symbols-outlined text-[16px]">south</span>
                </button>
              </motion.div>
            </div>
            <div className="hidden md:block md:col-span-3" />
          </div>
        </section>

        <motion.div
          className="relative w-full overflow-hidden py-8 border-y border-ink/15 z-10 flex items-center bg-paper-deep/60"
          {...revealMotion}
        >
          <div id="marquee-container" className="whitespace-nowrap flex flex-nowrap items-center w-max marquee-track marquee-fade-edges">
            <h2 className="marquee-text text-6xl md:text-8xl uppercase tracking-wide mx-4">Biotechnological Engineering <em>·</em> HealthTech Innovation <em>·</em> Hardware Prototyping <em>·</em>&nbsp;</h2>
            <h2 className="marquee-text text-6xl md:text-8xl uppercase tracking-wide mx-4">Biotechnological Engineering <em>·</em> HealthTech Innovation <em>·</em> Hardware Prototyping <em>·</em>&nbsp;</h2>
          </div>
        </motion.div>

        <motion.section className="relative w-full py-20 md:py-28 border-b border-ink/15 bg-paper/85" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[10%] md:pr-[10%]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <Counter target={4} suffix="+" label="Projects Built" />
              <Counter target={3} label="Hackathons Won" />
              <Counter target={5} suffix="+" label="Technologies" />
              <Counter target={100} suffix="%" label="Commitment" />
            </div>
          </div>
        </motion.section>

        <motion.section id="selected-work" className="relative w-full py-24 md:py-32 bg-paper/85" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[10%] md:pr-[10%]">
            <div className="mb-14 flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="micro-label mb-4">Index of work</div>
                <h3 className="display-serif text-ink text-5xl md:text-7xl leading-none">Selected <em>Work</em></h3>
              </div>
              <p className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.2em]">2024 — 2026 · Four systems</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  id={`project-${project.id}`}
                  layoutId={project.id}
                  transition={cardTransition}
                  onClick={() => setSelectedId(project.id)}
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const mx = ((event.clientX - rect.left) / rect.width) * 100;
                    const my = ((event.clientY - rect.top) / rect.height) * 100;
                    event.currentTarget.style.setProperty("--mx", `${mx}%`);
                    event.currentTarget.style.setProperty("--my", `${my}%`);
                  }}
                  whileHover={reduceMotion ? { scale: 1.003 } : { y: -6, scale: 1.005 }}
                  className={`project-card ${project.colClass} group relative flex flex-col justify-between p-8 md:p-12 min-h-[500px] md:min-h-[600px] rounded-lg cursor-pointer overflow-hidden`}
                >
                  <motion.div layoutId={`image-${project.id}`} className="absolute inset-0 overflow-hidden rounded-lg">
                    <img
                      alt={project.imageAlt}
                      className="w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-[1.03] transition-all duration-700"
                      src={project.image}
                    />
                  </motion.div>
                  <div className="x-ray-data absolute inset-0 z-0 p-8 opacity-0 pointer-events-none font-mono text-[10px] text-cobalt uppercase tracking-widest leading-relaxed flex items-end">
                    {project.xray.replace(/\|/g, " ")}
                  </div>
                  <div className="relative z-20 flex items-start justify-between">
                    <span className="font-mono text-xs text-cobalt">[{project.index}]</span>
                    <span className="inline-block px-3 py-1 border border-ink/40 text-ink font-mono text-[10px] uppercase tracking-[0.18em] rounded-full bg-card/80 backdrop-blur-sm">{project.tag}</span>
                  </div>
                  <div className="relative z-20">
                    <motion.h2 layoutId={`title-${project.id}`} className="display-serif text-ink text-5xl md:text-6xl leading-[0.95]">{project.title}</motion.h2>
                    <div className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion border border-vermilion/40 bg-vermilion/5 px-3 py-1 rounded-full mt-4 mb-4">★ {project.badge}</div>
                    <p className="text-ink-soft text-lg md:text-xl font-normal max-w-md leading-relaxed">{project.description}</p>
                    <div className="flex justify-end mt-8">
                      <a
                        className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-ink hover:text-cobalt transition-colors group-hover:translate-x-1 duration-300"
                        href={project.href}
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Case Study <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="lg:col-span-5 cursor-hover group relative flex items-center justify-between bg-card border border-ink/15 hover:border-cobalt p-8 md:p-12 transition-colors duration-500 rounded-lg mt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-8">
                  <div>
                    <div className="micro-label mb-3">Toolkit</div>
                    <h2 className="display-serif text-ink text-3xl md:text-4xl mb-2">Technical Capabilities</h2>
                    <p className="text-ink-soft text-base max-w-2xl">Specializing in the intersection of biological systems and digital architecture.</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {capabilities.map((capability) => (
                      <span
                        key={capability.label}
                        className="cursor-hover px-4 py-2 bg-paper text-ink text-sm rounded-full border border-ink/20 hover:border-cobalt hover:text-cobalt transition-colors"
                        onMouseEnter={() => {
                          setTrailer((prev) => ({ ...prev, visible: true, image: capability.image, label: capability.label }));
                        }}
                        onMouseLeave={() => {
                          setTrailer((prev) => ({ ...prev, visible: false, image: "", label: "" }));
                        }}
                      >
                        {capability.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section id="internships" className="relative w-full py-24 md:py-32 bg-paper/85 border-t border-ink/15" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[10%] md:pr-[10%]">
            <div className="mb-14 flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="micro-label mb-4">Internships &amp; Industry Work</div>
                <h3 className="display-serif text-ink text-5xl md:text-7xl leading-none">From the lab<br />to a <em>brand</em>.</h3>
              </div>
              <p className="font-mono text-[11px] text-ink-faint uppercase tracking-[0.2em] max-w-xs md:text-right">
                Where research-grade engineering meets a shipping product.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <RelivioTurntable reduceMotion={reduceMotion} />

              <div>
                <div className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion border border-vermilion/40 bg-vermilion/5 px-3 py-1 rounded-full mb-5">
                  ★ Internship · Emami Ltd
                </div>
                <h2 className="display-serif text-ink text-5xl md:text-6xl leading-[0.95] mb-1">Relivio</h2>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint mb-6">Dual-Modality Pain-Relief Patch</p>
                <p className="text-ink-soft text-lg leading-relaxed max-w-xl mb-8">
                  An all-in-one wearable patch that pairs <strong className="text-ink font-semibold">TENS</strong> electrical
                  stimulation with <strong className="text-ink font-semibold">Photobiomodulation (PBM)</strong> light therapy in a
                  single skin-worn device — designed and prototyped as an internship project for Emami Ltd.
                </p>

                <div className="flex flex-col gap-0 mb-8 max-w-xl">
                  {[
                    ["TENS", "Biphasic · 1–150 Hz · 0–50 mA · dual channel · 6 presets"],
                    ["PBM", "4× 660 nm red + 4× 940 nm IR LEDs · 4 presets"],
                    ["Modes", "Simultaneous · Sequential · TENS-only · PBM-only"],
                    ["Compute", "ESP32-S3 (proposed) · BLE GATT service profile"],
                    ["App", "Flutter companion · iOS + Android · live BLE control"]
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-5 py-3 border-b border-ink/12">
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-faint pt-1 shrink-0">{k}</span>
                      <span className="text-ink text-sm text-right leading-relaxed">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-7">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cobalt mb-2">My role</div>
                  <p className="text-ink-soft text-base leading-relaxed max-w-xl">
                    Designed the device in Fusion 360, specced the MCU and BLE service profile, and built the cross-platform
                    Flutter app that controls both modalities in real time.
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {["Fusion 360", "Embedded / BLE", "Flutter", "Medical Device", "TENS + PBM"].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-paper text-ink text-xs rounded-full border border-ink/20 font-mono uppercase tracking-[0.12em]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <AnimatePresence>
          {selectedProject ? (
            <motion.div className="fixed inset-0 z-50 bg-paper overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <motion.div layoutId={selectedProject.id} transition={cardTransition} className="w-full min-h-screen bg-paper px-6 md:px-12 py-8 md:py-12">
                <div className="w-full max-w-[1280px] mx-auto">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-mono text-xs text-cobalt">[{selectedProject.index}] — CASE FILE</span>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="btn-pill h-10 px-5 text-sm"
                    >
                      Close <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <motion.div layoutId={`image-${selectedProject.id}`} transition={cardTransition} className="w-full h-[38vh] md:h-[55vh] rounded-xl overflow-hidden border border-ink/20 shadow-[10px_10px_0_rgba(22,21,15,0.85)]">
                    <img src={selectedProject.image} alt={selectedProject.imageAlt} className="w-full h-full object-cover" />
                  </motion.div>

                  <div className="mt-10 md:mt-14 space-y-5">
                    <span className="inline-block px-3 py-1 border border-ink/40 text-ink font-mono text-[10px] uppercase tracking-[0.18em] rounded-full">{selectedProject.tag}</span>
                    <motion.h2 layoutId={`title-${selectedProject.id}`} transition={cardTransition} className="display-serif text-ink text-5xl md:text-7xl leading-[0.95]">
                      {selectedProject.title}
                    </motion.h2>
                    <div className="inline-block font-mono text-[10px] uppercase tracking-[0.18em] text-vermilion border border-vermilion/40 bg-vermilion/5 px-3 py-1 rounded-full">★ {selectedProject.badge}</div>
                    <p className="text-ink-soft text-lg md:text-2xl max-w-3xl leading-relaxed">{selectedProject.description}</p>
                    <p className="text-ink-soft/90 text-base md:text-lg max-w-4xl leading-relaxed">
                      This case study view is now app-like and route-less: the project physically expands from the Bento card into an immersive, full-screen narrative surface and collapses back seamlessly.
                    </p>

                    <div className="pt-4">
                      <a href={selectedProject.href} className="btn-pill h-12 px-7 text-sm">
                        Here&apos;s the Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.section className="relative w-full py-20 md:py-28 bg-paper/85" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[10%] md:pr-[10%]">
            <a
              href="./about.html#sbe"
              className="group relative flex flex-col md:flex-row items-stretch gap-8 md:gap-12 bg-card border border-ink rounded-lg p-8 md:p-12 overflow-hidden hover:border-cobalt transition-colors duration-500 shadow-[10px_10px_0_rgba(22,21,15,0.85)] hover:shadow-[10px_10px_0_rgba(43,63,242,0.85)]"
            >
              <div className="flex-1">
                <div className="micro-label mb-4">Campus Leadership · SBE VIT</div>
                <h3 className="display-serif text-ink text-4xl md:text-6xl leading-[0.98] mb-5">
                  From TEAMS member<br />to <em>Vice Chairperson</em>.
                </h3>
                <p className="text-ink-soft text-base md:text-lg max-w-xl leading-relaxed mb-6">
                  My journey through the Society for Biological Engineering at VIT — competing, building, hosting Georift, and now leading the chapter.
                </p>
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-ink group-hover:text-cobalt transition-colors">
                  Read the SBE journey <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
              </div>
              <div className="md:w-[280px] shrink-0 flex items-center">
                <div className="w-full rounded-md overflow-hidden border border-ink/20 rotate-2 group-hover:rotate-0 transition-transform duration-500">
                  <img src="/Vice Chair.jpeg" alt="Rudrabha as Vice Chairperson of SBE VIT" className="w-full h-48 md:h-56 object-cover object-[center_22%] grayscale group-hover:grayscale-0 transition-all duration-700" />
                </div>
              </div>
            </a>
          </div>
        </motion.section>

        <motion.footer className="w-full bg-ink text-paper relative z-50 rounded-t-[28px] mt-10" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[10%] md:pr-[10%] py-20 md:py-28">
            <div className="mb-16">
              <div className="micro-label mb-6" style={{ color: "rgba(245,241,230,0.6)" }}>Open for collaboration</div>
              <h4 className="display-serif text-paper text-5xl md:text-8xl leading-[0.95] mb-8">
                Let&apos;s build something<br />that <em className="text-vermilion not-italic" style={{ fontStyle: "italic" }}>matters</em>.
              </h4>
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="inline-flex items-center gap-3 border border-paper/40 rounded-full px-7 h-13 py-3 font-mono text-xs uppercase tracking-[0.18em] text-paper hover:bg-paper hover:text-ink transition-colors"
              >
                Start a Conversation <span className="material-symbols-outlined text-[18px]">arrow_outward</span>
              </button>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-8 border-t border-paper/15">
              <div>
                <h5 className="font-mono text-paper font-bold text-xs tracking-[0.2em] mb-1">RUDRABHA DASGUPTA</h5>
                <p className="text-paper/50 text-sm">Biotechnological Engineer &amp; HealthTech Innovator</p>
              </div>
              <div className="flex gap-8">
                <a className="text-paper/70 hover:text-vermilion transition-colors text-sm" href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn</a>
                <a className="text-paper/70 hover:text-vermilion transition-colors text-sm" href={`mailto:${contactEmail}`}>Email</a>
              </div>
              <div className="text-paper/40 font-mono text-xs">&copy; 2026 Rudrabha Dasgupta. All rights reserved.</div>
            </div>
          </div>
        </motion.footer>

        <AnimatePresence>
          {isComposeOpen ? (
            <motion.div
              className="fixed bottom-6 right-6 z-[140] w-[420px] max-w-[calc(100vw-48px)] rounded-xl border border-ink bg-card shadow-[10px_10px_0_rgba(22,21,15,0.85)] overflow-hidden"
              initial={reduceMotion ? false : { y: 24, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 24, opacity: 0 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-label="Compose message"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10 bg-paper-deep/60">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-soft">✉ New Message</div>
                <button
                  type="button"
                  className="text-ink-faint hover:text-ink transition-colors"
                  onClick={() => setIsComposeOpen(false)}
                  aria-label="Close compose"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="px-4 py-3 border-b border-ink/10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink-faint">To</span>
                  <span className="text-ink font-medium">{contactEmail}</span>
                </div>
              </div>

              <form
                ref={composeFormRef}
                onSubmit={(event) => {
                  event.preventDefault();
                  sendDirectEmail();
                }}
              >
                <input type="hidden" name="to_email" value={contactEmail} />
                <input type="hidden" name="reply_to" value={composeDraft.fromEmail} />
                <input
                  type="hidden"
                  name="attachment_names"
                  value={(composeDraft.attachments || []).map((file) => file.name).join(", ")}
                />

                <div className="px-4 py-3 border-b border-ink/10">
                  <label className="block font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint mb-1" htmlFor="compose-from">Your Email</label>
                  <input
                    id="compose-from"
                    name="from_email"
                    className="w-full bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 text-ink text-sm outline-none focus:border-cobalt"
                    placeholder="you@example.com"
                    value={composeDraft.fromEmail}
                    onChange={(event) => setComposeDraft((prev) => ({ ...prev, fromEmail: event.target.value }))}
                    disabled={isSending}
                  />
                </div>

                <div className="px-4 py-3 border-b border-ink/10">
                  <label className="block font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint mb-1" htmlFor="compose-subject">Subject</label>
                  <input
                    id="compose-subject"
                    name="subject"
                    className="w-full bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 text-ink text-sm outline-none focus:border-cobalt"
                    placeholder="Subject"
                    value={composeDraft.subject}
                    onChange={(event) => setComposeDraft((prev) => ({ ...prev, subject: event.target.value }))}
                    disabled={isSending}
                  />
                </div>

                <div className="px-4 py-3">
                  <label className="block font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint mb-1" htmlFor="compose-body">Message</label>
                  <textarea
                    id="compose-body"
                    name="message"
                    className="w-full bg-paper/60 border border-ink/15 rounded-lg px-3 py-2 text-ink text-sm outline-none focus:border-cobalt min-h-[120px] resize-none"
                    placeholder="Write your message..."
                    value={composeDraft.body}
                    onChange={(event) => setComposeDraft((prev) => ({ ...prev, body: event.target.value }))}
                    disabled={isSending}
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink/15 hover:border-cobalt text-ink-soft hover:text-ink transition-colors cursor-pointer text-sm">
                      <span className="material-symbols-outlined text-[18px]">attach_file</span>
                      Attach
                      <input
                        ref={composeFileRef}
                        type="file"
                        name="attachments"
                        className="hidden"
                        multiple
                        disabled={isSending}
                        onChange={(event) => {
                          const files = Array.from(event.target.files || []);
                          setComposeDraft((prev) => ({ ...prev, attachments: files }));
                        }}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={!canSendEmail}
                      className={`inline-flex items-center justify-center h-10 px-6 rounded-full text-sm font-bold tracking-wide transition-colors ${
                        canSendEmail
                          ? "bg-ink text-paper hover:bg-cobalt"
                          : "bg-ink/5 border border-ink/10 text-ink/30 cursor-not-allowed"
                      }`}
                    >
                      {isSending ? "Sending..." : "Send"}
                    </button>
                  </div>

                  {(composeDraft.attachments || []).length ? (
                    <div className="mt-3 text-xs text-ink-faint">
                      Attachments selected: {(composeDraft.attachments || []).map((file) => file.name).join(", ")}
                    </div>
                  ) : null}

                  {emailJsReady && (!composeDraft.fromEmail.trim() || !composeDraft.subject.trim() || !composeDraft.body.trim()) ? (
                    <div className="mt-3 text-xs text-ink-faint">Enter your email, subject, and message to enable Send.</div>
                  ) : null}

                  {composeStatus.type !== "idle" ? (
                    <div
                      className={`mt-3 text-xs ${
                        composeStatus.type === "error"
                          ? "text-vermilion"
                          : composeStatus.type === "success"
                            ? "text-moss"
                            : "text-ink-faint"
                      }`}
                    >
                      {composeStatus.message}
                    </div>
                  ) : !emailJsReady ? (
                    <div className="mt-3 text-xs text-ink-faint">
                      Configure EmailJS (VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY) to enable direct send.
                    </div>
                  ) : null}
                </div>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
