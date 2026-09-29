import { useState } from "react";
import { api } from "../api/client";

// "Chat with us" — rule-based for now (see backend/src/modules/assistant/
// knowledge.js; no LLM key configured yet). When it can't answer, it offers
// a real escalation path instead of pretending to help further.
const SUPPORT_EMAIL = "xc@cr8.com.ng";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Ask me anything about using Kora.", escalate: false },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setSending(true);
    try {
      const data = await api.post("/assistant/chat", { message: text });
      setMessages((m) => [...m, { from: "bot", text: data.answer, escalate: data.escalate }]);
    } catch {
      setMessages((m) => [...m, { from: "bot", text: "Something went wrong reaching support chat.", escalate: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--primary)",
          color: "white",
          border: "none",
          fontSize: "1.4rem",
          cursor: "pointer",
          boxShadow: "0 10px 30px -8px rgba(37,99,235,0.5)",
          zIndex: 100,
        }}
        aria-label="Chat with us"
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            width: 340,
            maxHeight: 460,
            display: "flex",
            flexDirection: "column",
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 14,
            boxShadow: "0 20px 60px -20px rgba(15,23,42,0.35)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>
            Chat with us
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  style={{
                    alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                    background: m.from === "user" ? "var(--primary)" : "#f1f5f9",
                    color: m.from === "user" ? "white" : "var(--text)",
                    padding: "8px 12px",
                    borderRadius: 12,
                    fontSize: "0.88rem",
                    maxWidth: "85%",
                    marginLeft: m.from === "user" ? "auto" : 0,
                  }}
                >
                  {m.text}
                </div>
                {m.escalate && (
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    style={{ fontSize: "0.8rem", display: "inline-block", marginTop: 6 }}
                  >
                    Reach out to our team →
                  </a>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={send} style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a question..."
              style={{ flex: 1, border: "none", padding: "10px 14px", outline: "none" }}
            />
            <button className="btn" disabled={sending} style={{ borderRadius: 0 }} type="submit">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
