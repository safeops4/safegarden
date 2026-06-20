import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { api } from "../api";

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Bonjour ! Je suis l'assistant IA SafeGuardian. Posez-moi une question sur l'application (alertes, objets, documents, bracelet...)." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await api("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
        if (data.results && data.results.length > 0) {
          setMessages(prev => [...prev, {
            role: "bot",
            text: `🔍 ${data.results.length} résultat(s) trouvé(s) en base. Consultez les sections correspondantes.`,
            isResult: true
          }]);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: "Désolé, je n'ai pas pu contacter le serveur. Réessayez plus tard." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: "90px", right: "20px", zIndex: 1000,
          width: "360px", maxHeight: "500px",
          background: "var(--bg-card)", borderRadius: "16px",
          border: "1px solid var(--border-glass)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", backdropFilter: "blur(12px)"
        }}>
          <div style={{
            padding: "1rem", borderBottom: "1px solid var(--border-glass)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(0, 114, 255, 0.05))"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bot size={20} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontWeight: 700 }}>Assistant IA</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", gap: "0.5rem",
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%"
              }}>
                {m.role === "bot" && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0, 217, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bot size={14} style={{ color: "var(--color-primary)" }} />
                  </div>
                )}
                <div style={{
                  padding: "0.6rem 0.85rem", borderRadius: "12px", fontSize: "0.85rem", lineHeight: "1.4",
                  background: m.role === "user" ? "var(--color-primary)" : "rgba(255,255,255,0.06)",
                  color: m.role === "user" ? "white" : "var(--text-primary)",
                  whiteSpace: "pre-wrap"
                }}>
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={14} style={{ color: "white" }} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: "0.5rem", alignSelf: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0, 217, 255, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={14} style={{ color: "var(--color-primary)" }} />
                </div>
                <div style={{ padding: "0.6rem 0.85rem", borderRadius: "12px", fontSize: "0.85rem", background: "rgba(255,255,255,0.06)" }}>
                  <span className="pulse-active">● ● ●</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border-glass)" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="form-control"
                placeholder="Posez votre question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
                style={{ fontSize: "0.85rem" }}
              />
              <button onClick={handleSend} disabled={loading || !input.trim()} className="btn btn-primary" style={{ padding: "0.5rem", height: "auto" }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: "20px", right: "20px", zIndex: 1000,
        width: "56px", height: "56px", borderRadius: "50%",
        background: "linear-gradient(135deg, var(--color-primary), #0072ff)",
        border: "none", color: "white", cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0, 217, 255, 0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.3s ease"
      }}>
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}