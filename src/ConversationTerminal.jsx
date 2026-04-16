import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const BOOT_LINE_1 = "INITIALIZING SECURE CONNECTION...";
const BOOT_LINE_2 =
  "Hello. I am the digital intake assistant for Rudrabha's ecosystem. Are you inquiring about hardware prototyping, a HealthTech consultation, or a recruitment opportunity?";

export default function ConversationTerminal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const apiEndpoint = "/api/chat";
  const model = "llama-3.3-70b-versatile";
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef(null);
  const bootTimersRef = useRef([]);

  useEffect(() => {
    if (!isOpen) return;

    setMessages([]);
    setInput("");
    setIsThinking(false);

    const timerOne = setTimeout(() => {
      setMessages([{ id: crypto.randomUUID(), sender: "system", text: BOOT_LINE_1 }]);
    }, 500);

    const timerTwo = setTimeout(() => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "system", text: BOOT_LINE_2 }]);
    }, 1300);

    bootTimersRef.current = [timerOne, timerTwo];

    return () => {
      bootTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      bootTimersRef.current = [];
    };
  }, [isOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (isThinking) return;

    const next = input.trim();
    if (!next) return;

    const guestMessage = { id: crypto.randomUUID(), sender: "user", text: next };
    const updated = [...messages, guestMessage];
    setMessages(updated);
    setInput("");
    setIsThinking(true);

    const chatHistory = updated.map((message) => ({
      role: message.sender === "system" ? "assistant" : "user",
      content: message.text
    }));

    const payload = {
      model: model.trim() || "llama-3.3-70b-versatile",
      messages: chatHistory,
      temperature: 0.45
    };

    try {
      const response = await fetch(apiEndpoint.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`API ${response.status}: ${detail || "No response body"}`);
      }

      const data = await response.json();
      const reply = (data?.reply || data?.choices?.[0]?.message?.content || "").trim();

      if (!reply) {
        throw new Error("API returned no assistant message.");
      }

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "system", text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "system",
          text: `TRANSMISSION_ERROR: ${error instanceof Error ? error.message : "Unknown API failure"}`
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#060708]/70 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="terminal-shell terminal-cursor-visible w-full max-w-[640px] md:w-[600px] text-sm font-mono text-white shadow-[0_20px_70px_rgba(0,0,0,0.6)]"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="h-11 border-b border-[#2A2314] px-4 flex items-center justify-between bg-[#0D0B08]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-[#C86C5B] hover:opacity-90 transition-opacity"
                  aria-label="Close conversation terminal"
                />
                <span className="text-[11px] tracking-[0.22em] text-[#C9A84C]/80">SYSTEM_INTAKE_PROTOCOL_v1.0</span>
              </div>
            </div>

            <div className="h-[360px] overflow-y-auto px-4 py-4 space-y-3 terminal-grid bg-[#090806]/90">
              {messages.map((message) => (
                <div key={message.id} className={message.sender === "system" ? "text-left" : "text-right"}>
                  <p className={message.sender === "system" ? "text-[#C9A84C]/85" : "text-white/75"}>
                    <span className="opacity-80">{message.sender === "system" ? "> SYSTEM: " : "> GUEST: "}</span>
                    {message.text}
                  </p>
                </div>
              ))}
              {isThinking ? (
                <p className="text-left text-[#C9A84C]/75">
                  <span className="opacity-80">&gt; SYSTEM: </span>
                  Processing request...
                </p>
              ) : null}
              <div ref={endRef} />
            </div>

            <div className="border-t border-[#2A2314] px-4 py-3 bg-[#0D0A07]">
              <div className="flex items-center gap-2">
                <span className="text-[#C9A84C]/85">&gt;</span>
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSend();
                  }}
                  placeholder="Enter intake query..."
                  className="terminal-input flex-1 bg-transparent rounded-none border-none outline-none text-[#E0C56B]/95 placeholder:text-[#7E6940]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isThinking}
                  className="text-xs uppercase tracking-wider text-[#B89B47]/70 hover:text-[#E0C56B] transition-colors disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
