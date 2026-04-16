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
    colClass: "lg:col-span-3",
    image: "/LateralX.png",
    imageAlt: "High-fidelity 3D render of a futuristic wearable medical band sensor on a dark background",
    tag: "Hardware",
    title: "Lateral X",
    badge: "1st Place - Dr. Dev Hackathon",
    description: "Advanced wearable balance correction system designed for post-stroke rehabilitation and active stabilization.",
    xray: "CALIBRATING GYROSCOPE... | NEURAL INHIBITION: DETECTED | STABILIZATION ALGORITHM: DEPLOYED..."
  },
  {
    id: "card-glucopatch",
    colClass: "lg:col-span-2",
    image: "/glucopatch-bg.png",
    imageAlt: "Clean mockup of a modern mobile app dashboard next to a small biometric sensor",
    tag: "Ecosystem",
    title: "GlucoPatch Ecosystem",
    badge: "12th Place - Health Hack",
    description: "Non-invasive continuous glucose monitoring platform connecting patient sensors to clinical dashboards.",
    xray: "CONNECTING SENSOR... | BLOOD GLUCOSE: 105 MG/DL | TREND: STABLE | SYNCING DASHBOARD..."
  },
  {
    id: "card-armex",
    colClass: "lg:col-span-2",
    image: "/Armex.png",
    imageAlt: "Armex soft-robotic tremor-restricting smart sleeve",
    tag: "Soft-Robotics",
    title: "Armex",
    badge: "Medicathon finalist",
    description: "Tremor restricting Smart sleeves.",
    xray: "INITIALIZING STABILIZATION PROTOCOL... | WET LAB PARAMS: NORMAL | DRY LAB ALGORITHMS: ACTIVE..."
  },
  {
    id: "card-agrosync",
    colClass: "lg:col-span-3",
    image: "/AgroSync.png",
    imageAlt: "AgroSync data-driven agricultural synchronization platform visualization",
    tag: "AgriTech",
    title: "AgroSync",
    badge: "Idea Hack 1.0 Winner",
    description: "Data-driven agricultural synchronization platform.",
    xray: "ANALYZING SOIL MOISTURE... | SATELLITE IMAGERY: SYNCED | YIELD PREDICTION: OPTIMAL..."
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
      className="text-center"
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, amount: 0.7 }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <span className="text-[#C9A84C] text-4xl md:text-5xl font-black">{value}</span>
      <span className="text-[#C9A84C] text-4xl md:text-5xl font-black">{suffix}</span>
      <p className="text-text-secondary text-sm mt-2 uppercase tracking-wider">{label}</p>
    </motion.div>
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
    document.documentElement.classList.add("dark");
    const enableCursor = !motionProfile.coarse && !motionProfile.reduced && !isTerminalOpen;
    document.body.classList.toggle("js-cursor-ready", enableCursor);

    const timer = setTimeout(() => setShowPreloader(false), 1400);
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
      clearTimeout(timer);
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
        viewport: { once: true, amount: 0.2 },
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
            className="fixed inset-0 z-[999] bg-[#0B0D1A] flex items-center justify-center pointer-events-none"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="overflow-hidden">
              <motion.span
                id="preloader-text"
                className="text-[#C9A84C] text-sm tracking-[0.3em] uppercase font-display inline-block"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.7 }}
              >
                Rudrabha Dasgupta
              </motion.span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        id="scroll-progress"
        className="fixed top-0 left-0 h-[2px] z-[999] pointer-events-none"
        style={{
          width: `${scrollProgress}%`,
          background: "linear-gradient(90deg, #C9A84C, #D4A853)",
          boxShadow: "0 0 8px rgba(201,168,76,0.6)"
        }}
      />

      {enableCursor ? (
        <motion.div
          id="trailing-image"
          className="fixed top-0 left-0 w-48 h-32 rounded bg-white/5 backdrop-blur-md border border-white/20 pointer-events-none z-[110] overflow-hidden flex items-center justify-center"
          style={{ x: smoothTrailerX, y: smoothTrailerY }}
          animate={{
            xPercent: -50,
            yPercent: -50,
            opacity: trailer.visible ? 1 : 0,
            scale: trailer.visible ? 1 : 0.7
          }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
        >
          {trailer.image ? (
            <img src={trailer.image} alt={trailer.label} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/60 text-xs font-mono">[ CAPABILITY VISUAL ]</span>
          )}
        </motion.div>
      ) : null}

      {enableCursor ? (
        <>
          <motion.div
            id="custom-cursor"
            className={`fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-[120] ${cursorMode === "interactive" ? "bg-[#C9A84C]" : "bg-white"} mix-blend-difference`}
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
        </>
      ) : null}

      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-6 mix-blend-difference text-white w-full max-w-[1920px] mx-auto"
        initial={reduceMotion ? false : { y: -28, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[24px]">grid_view</span>
          <span className="text-sm font-bold tracking-wider">RUDRABHA DASGUPTA | INNOVATOR</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="relative" ref={workMenuRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#C9A84C] transition-colors"
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
                className="mix-blend-normal absolute right-0 mt-3 w-80 rounded-xl border border-[#C9A84C]/25 bg-[#0B0D1A]/95 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.55)] overflow-hidden"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-text-tertiary">Projects</p>
                </div>
                <div className="py-1">
                  {projects.map((project) => (
                    <button
                      key={`menu-${project.id}`}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-[#C9A84C]/10 transition-colors"
                      role="menuitem"
                      onClick={() => {
                        scrollToSelectedWork();
                        setTimeout(() => scrollToProjectCard(project.id), 250);
                        setIsWorkMenuOpen(false);
                      }}
                    >
                      <div className="text-white text-sm font-semibold leading-tight">{project.title}</div>
                      <div className="text-text-tertiary text-[11px] mt-1 uppercase tracking-wider">{project.tag}</div>
                    </button>
                  ))}
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-4 py-3 text-text-tertiary text-sm">More to be added</div>
                </div>
              </div>
            ) : null}
          </div>

          <a className="text-sm font-medium hover:text-[#C9A84C] transition-colors" href="./about.html">ABOUT</a>

          <div className="relative" ref={contactMenuRef}>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#C9A84C] transition-colors"
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
                className="mix-blend-normal absolute right-0 mt-3 w-80 rounded-xl border border-[#C9A84C]/25 bg-[#0B0D1A]/95 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.55)] overflow-hidden"
                role="menu"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-[10px] tracking-[0.22em] uppercase text-text-tertiary">Reach out</p>
                </div>
                <div className="py-1">
                  <a
                    className="block px-4 py-3 hover:bg-[#C9A84C]/10 transition-colors"
                    href={`mailto:${contactEmail}`}
                    role="menuitem"
                  >
                    <div className="text-white text-sm font-semibold leading-tight">Email</div>
                    <div className="text-text-tertiary text-[11px] mt-1">{contactEmail}</div>
                  </a>
                  <a
                    className="block px-4 py-3 hover:bg-[#C9A84C]/10 transition-colors"
                    href={linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                  >
                    <div className="text-white text-sm font-semibold leading-tight">LinkedIn</div>
                    <div className="text-text-tertiary text-[11px] mt-1">Open profile</div>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 main-content">
        <section className="relative min-h-screen w-full flex items-center overflow-hidden">
          <div className="relative z-20 w-full max-w-[1920px] mx-auto px-6 md:pl-[12%] md:pr-10 grid grid-cols-1 md:grid-cols-12 h-full">
            <div className="md:col-span-7 flex flex-col justify-center gap-12 pt-20 md:pt-0">
              <div className="space-y-6">
                <div className="overflow-hidden">
                  <motion.h1 id="hero-headline" className="text-white text-5xl md:text-8xl lg:text-[130px] font-black leading-[0.9] tracking-[-0.04em]" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9 }}>
                    Building systems that <span className="matter-glow">matter</span>.
                  </motion.h1>
                </div>
                <motion.p className="text-text-secondary text-lg md:text-2xl font-normal leading-[1.6] max-w-2xl" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.15 }}>
                  From wearable balance correction to non-invasive diagnostic ecosystems. I design, code, and consult on projects that bridge human need with flawless technical execution.
                </motion.p>
              </div>
              <motion.div className="flex items-center gap-6" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.28 }}>
                <button
                  type="button"
                  onClick={() => setIsTerminalOpen(true)}
                  className="inline-flex items-center justify-center h-14 px-8 border border-[#C9A84C] text-white text-base font-bold tracking-wide hover:bg-[#C9A84C] hover:text-[#0B0D1A] transition-all duration-300 ease-in-out rounded-full animate-glow-pulse"
                >
                  Start a Conversation
                </button>
              </motion.div>
            </div>
            <div className="hidden md:block md:col-span-5" />
          </div>
        </section>

        <motion.div
          className="relative w-full overflow-hidden py-10 bg-transparent border-y border-[#C9A84C]/10 z-10 flex items-center"
          {...revealMotion}
        >
          <div id="marquee-container" className="whitespace-nowrap flex flex-nowrap items-center w-max marquee-track marquee-fade-edges">
            <h2 className="marquee-text text-6xl md:text-8xl font-black uppercase tracking-widest mx-4 text-[#C9A84C]/[0.08]">BIOTECHNOLOGICAL ENGINEERING • HEALTHTECH INNOVATION • HARDWARE PROTOTYPING • </h2>
            <h2 className="marquee-text text-6xl md:text-8xl font-black uppercase tracking-widest mx-4 text-[#C9A84C]/[0.08]">BIOTECHNOLOGICAL ENGINEERING • HEALTHTECH INNOVATION • HARDWARE PROTOTYPING • </h2>
          </div>
        </motion.div>

        <motion.section className="relative w-full py-20 md:py-28 border-b border-[#C9A84C]/10 bg-surface-dark" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[12%] md:pr-[12%]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              <Counter target={4} suffix="+" label="Projects Built" />
              <Counter target={3} label="Hackathons Won" />
              <Counter target={5} suffix="+" label="Technologies" />
              <Counter target={100} suffix="%" label="Commitment" />
            </div>
          </div>
        </motion.section>

        <motion.section id="selected-work" className="relative w-full bg-background-dark py-24 md:py-32" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[12%] md:pr-[12%]">
            <div className="mb-12">
              <h3 className="text-text-tertiary text-base font-medium tracking-[0.2em] uppercase">Selected Work</h3>
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
                  whileHover={reduceMotion ? { scale: 1.003 } : { y: -4, scale: 1.008 }}
                  className={`project-card ${project.colClass} group relative flex flex-col justify-between bg-surface-dark border border-border-dark p-8 md:p-12 min-h-[500px] md:min-h-[600px] hover:border-[#C9A84C]/50 transition-colors duration-500 rounded cursor-pointer`}
                >
                  <motion.div layoutId={`image-${project.id}`} className="absolute inset-0 overflow-hidden rounded group-hover:opacity-100 transition-opacity duration-700">
                    <img alt={project.imageAlt} className="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700" src={project.image} />
                  </motion.div>
                  <div className="x-ray-data absolute inset-0 z-0 p-8 opacity-0 pointer-events-none font-display text-[10px] text-[#C9A84C]/50 uppercase tracking-widest leading-relaxed flex items-end">
                    {project.xray.replace(/\|/g, " ")}
                  </div>
                  <div className="relative z-20 transition-opacity duration-300">
                    <span className="inline-block px-3 py-1 mb-6 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-mono uppercase tracking-wider rounded-full backdrop-blur-sm">{project.tag}</span>
                    <motion.h2 layoutId={`title-${project.id}`} className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tight">{project.title}</motion.h2>
                    <div className="inline-block text-xs uppercase tracking-wider text-[#C9A84C]/70 bg-[#C9A84C]/10 px-3 py-1 rounded-full mt-4 mb-4">{project.badge}</div>
                    <p className="text-text-secondary text-lg md:text-xl font-normal max-w-md leading-relaxed">{project.description}</p>
                  </div>
                  <div className="relative z-20 flex justify-end mt-12 transition-opacity duration-300">
                    {project.id === "card-lateralx" ? (
                      <a
                        className="inline-flex items-center gap-2 text-white text-base font-medium hover:text-[#C9A84C] transition-colors group-hover:translate-x-1 transition-transform duration-300"
                        href="./lateral-x-showcase.html"
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Case Study <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </a>
                    ) : project.id === "card-glucopatch" ? (
                      <a
                        className="inline-flex items-center gap-2 text-white text-base font-medium hover:text-[#C9A84C] transition-colors group-hover:translate-x-1 transition-transform duration-300"
                        href="./glucopatch_simulation.html"
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Case Study <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </a>
                    ) : project.id === "card-armex" ? (
                      <a
                        className="inline-flex items-center gap-2 text-white text-base font-medium hover:text-[#C9A84C] transition-colors group-hover:translate-x-1 transition-transform duration-300"
                        href="./aura-sleeve.html"
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Case Study <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </a>
                    ) : project.id === "card-agrosync" ? (
                      <a
                        className="inline-flex items-center gap-2 text-white text-base font-medium hover:text-[#C9A84C] transition-colors group-hover:translate-x-1 transition-transform duration-300"
                        href="./agrosync.html"
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Case Study <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-white text-base font-medium hover:text-[#C9A84C] transition-colors group-hover:translate-x-1 transition-transform duration-300">
                        View Case Study <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              <div className="lg:col-span-5 group relative flex items-center justify-between bg-surface-dark border border-border-dark p-8 md:p-12 hover:border-[#C9A84C]/50 transition-colors duration-500 rounded mt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-8">
                  <div>
                    <h2 className="text-white text-2xl md:text-3xl font-bold tracking-tight mb-2">Technical Capabilities</h2>
                    <p className="text-text-secondary text-base max-w-2xl">Specializing in the intersection of biological systems and digital architecture.</p>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {capabilities.map((capability) => (
                      <span
                        key={capability.label}
                        className="cursor-hover px-4 py-2 bg-[#10132A] text-text-secondary text-sm rounded border border-transparent hover:border-[#C9A84C]/40 transition-colors"
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

        <AnimatePresence>
          {selectedProject ? (
            <motion.div className="fixed inset-0 z-50 bg-[#0A0A0A] overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <motion.div layoutId={selectedProject.id} transition={cardTransition} className="w-full min-h-screen bg-[#0A0A0A] px-6 md:px-12 py-8 md:py-12">
                <div className="w-full max-w-[1280px] mx-auto">
                  <div className="flex justify-end mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#C9A84C] border border-[#C9A84C]/50 rounded-full hover:bg-[#C9A84C] hover:text-[#0B0D1A] transition-colors"
                    >
                      Close <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  <motion.div layoutId={`image-${selectedProject.id}`} transition={cardTransition} className="w-full h-[38vh] md:h-[55vh] rounded-xl overflow-hidden border border-border-dark">
                    <img src={selectedProject.image} alt={selectedProject.imageAlt} className="w-full h-full object-cover" />
                  </motion.div>

                  <div className="mt-8 md:mt-12 space-y-5">
                    <span className="inline-block px-3 py-1 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-mono uppercase tracking-wider rounded-full">{selectedProject.tag}</span>
                    <motion.h2 layoutId={`title-${selectedProject.id}`} transition={cardTransition} className="text-white text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                      {selectedProject.title}
                    </motion.h2>
                    <div className="inline-block text-xs uppercase tracking-wider text-[#C9A84C]/70 bg-[#C9A84C]/10 px-3 py-1 rounded-full">{selectedProject.badge}</div>
                    <p className="text-text-secondary text-lg md:text-2xl max-w-3xl leading-relaxed">{selectedProject.description}</p>
                    <p className="text-text-secondary/90 text-base md:text-lg max-w-4xl leading-relaxed">
                      This case study view is now app-like and route-less: the project physically expands from the Bento card into an immersive, full-screen narrative surface and collapses back seamlessly.
                    </p>

                    {selectedProject.id === "card-lateralx" ? (
                      <div className="pt-4">
                        <a
                          href="./lateral-x-showcase.html"
                          className="inline-flex items-center justify-center h-12 px-6 border border-[#C9A84C] text-white text-sm font-bold tracking-wide hover:bg-[#C9A84C] hover:text-[#0B0D1A] transition-colors rounded-full"
                        >
                          Here's the Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </a>
                      </div>
                    ) : selectedProject.id === "card-glucopatch" ? (
                      <div className="pt-4">
                        <a
                          href="./glucopatch_simulation.html"
                          className="inline-flex items-center justify-center h-12 px-6 border border-[#C9A84C] text-white text-sm font-bold tracking-wide hover:bg-[#C9A84C] hover:text-[#0B0D1A] transition-colors rounded-full"
                        >
                          Here's the Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </a>
                      </div>
                    ) : selectedProject.id === "card-armex" ? (
                      <div className="pt-4">
                        <a
                          href="./aura-sleeve.html"
                          className="inline-flex items-center justify-center h-12 px-6 border border-[#C9A84C] text-white text-sm font-bold tracking-wide hover:bg-[#C9A84C] hover:text-[#0B0D1A] transition-colors rounded-full"
                        >
                          Here's the Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </a>
                      </div>
                    ) : selectedProject.id === "card-agrosync" ? (
                      <div className="pt-4">
                        <a
                          href="./agrosync.html"
                          className="inline-flex items-center justify-center h-12 px-6 border border-[#C9A84C] text-white text-sm font-bold tracking-wide hover:bg-[#C9A84C] hover:text-[#0B0D1A] transition-colors rounded-full"
                        >
                          Here's the Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.footer className="w-full bg-surface-dark border-t border-[#C9A84C]/10 relative z-50" {...revealMotion}>
          <div className="w-full max-w-[1920px] mx-auto px-6 md:pl-[12%] md:pr-[12%] py-20 md:py-28">
            <div className="mb-16">
              <h4 className="text-white text-3xl md:text-5xl font-bold tracking-tight mb-4">Let&apos;s build something that matters.</h4>
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="inline-flex items-center gap-2 text-[#C9A84C] text-base font-medium hover:text-white transition-colors"
              >
                Start a Conversation <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-8 border-t border-border-dark">
              <div>
                <h5 className="text-white font-bold text-sm tracking-wider mb-1">RUDRABHA DASGUPTA</h5>
                <p className="text-text-tertiary text-sm">Biotechnological Engineer &amp; HealthTech Innovator</p>
              </div>
              <div className="flex gap-8">
                <a className="text-text-secondary hover:text-[#C9A84C] transition-colors text-sm" href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn</a>
                <a className="text-text-secondary hover:text-[#C9A84C] transition-colors text-sm" href={`mailto:${contactEmail}`}>Email</a>
              </div>
              <div className="text-text-tertiary text-xs">&copy; 2026 Rudrabha Dasgupta. All rights reserved.</div>
            </div>
          </div>
        </motion.footer>

        <AnimatePresence>
          {isComposeOpen ? (
            <motion.div
              className="fixed bottom-6 right-6 z-[140] w-[420px] max-w-[calc(100vw-48px)] rounded-xl border border-[#C9A84C]/25 bg-[#0B0D1A]/95 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.65)] overflow-hidden"
              initial={reduceMotion ? false : { y: 24, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 24, opacity: 0 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-label="Compose message"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-[11px] tracking-[0.22em] uppercase text-text-tertiary">New Message</div>
                <button
                  type="button"
                  className="text-text-tertiary hover:text-white transition-colors"
                  onClick={() => setIsComposeOpen(false)}
                  aria-label="Close compose"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-tertiary">To</span>
                  <span className="text-white font-medium">{contactEmail}</span>
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

                <div className="px-4 py-3 border-b border-white/10">
                  <label className="block text-[10px] tracking-[0.22em] uppercase text-text-tertiary mb-1" htmlFor="compose-from">Your Email</label>
                <input
                  id="compose-from"
                  name="from_email"
                  className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]/60"
                  placeholder="you@example.com"
                  value={composeDraft.fromEmail}
                  onChange={(event) => setComposeDraft((prev) => ({ ...prev, fromEmail: event.target.value }))}
                  disabled={isSending}
                />
              </div>

              <div className="px-4 py-3 border-b border-white/10">
                <label className="block text-[10px] tracking-[0.22em] uppercase text-text-tertiary mb-1" htmlFor="compose-subject">Subject</label>
                <input
                  id="compose-subject"
                  name="subject"
                  className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]/60"
                  placeholder="Subject"
                  value={composeDraft.subject}
                  onChange={(event) => setComposeDraft((prev) => ({ ...prev, subject: event.target.value }))}
                  disabled={isSending}
                />
              </div>

              <div className="px-4 py-3">
                <label className="block text-[10px] tracking-[0.22em] uppercase text-text-tertiary mb-1" htmlFor="compose-body">Message</label>
                <textarea
                  id="compose-body"
                  name="message"
                  className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#C9A84C]/60 min-h-[120px] resize-none"
                  placeholder="Write your message..."
                  value={composeDraft.body}
                  onChange={(event) => setComposeDraft((prev) => ({ ...prev, body: event.target.value }))}
                  disabled={isSending}
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-[#C9A84C]/40 text-text-secondary hover:text-white transition-colors cursor-pointer text-sm">
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
                    className={`inline-flex items-center justify-center h-10 px-5 rounded-full border transition-colors text-sm font-bold tracking-wide ${
                      canSendEmail
                        ? "border-[#C9A84C] text-white hover:bg-[#C9A84C] hover:text-[#0B0D1A]"
                        : "border-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>

                {(composeDraft.attachments || []).length ? (
                  <div className="mt-3 text-xs text-text-tertiary">
                    Attachments selected: {(composeDraft.attachments || []).map((file) => file.name).join(", ")}
                  </div>
                ) : null}

                {emailJsReady && (!composeDraft.fromEmail.trim() || !composeDraft.subject.trim() || !composeDraft.body.trim()) ? (
                  <div className="mt-3 text-xs text-text-tertiary">Enter your email, subject, and message to enable Send.</div>
                ) : null}

                {composeStatus.type !== "idle" ? (
                  <div
                    className={`mt-3 text-xs ${
                      composeStatus.type === "error"
                        ? "text-red-300"
                        : composeStatus.type === "success"
                          ? "text-emerald-300"
                          : "text-text-tertiary"
                    }`}
                  >
                    {composeStatus.message}
                  </div>
                ) : !emailJsReady ? (
                  <div className="mt-3 text-xs text-text-tertiary">
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
