import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Smartphone, Wifi, Copy, Check, RefreshCw, ArrowLeft, AlertTriangle, Battery, Clock } from "lucide-react";
import { api } from "../api";

export default function Esp32Pairing() {
  const [esp32s, setEsp32s] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastCode, setLastCode] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await api("/esp32/status");
      if (res.ok) setEsp32s(await res.json());
    } catch (e) {
      console.error("Erreur chargement ESP32", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const generateCode = async () => {
    setGenerating(true);
    setError("");
    setSuccess("");
    setCopied(false);
    try {
      const res = await api("/esp32/generate-code", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastCode(data.esp32.pairingCode);
        setSuccess(`Code d'appairage généré : ${data.esp32.pairingCode}`);
        fetchStatus();
      } else {
        setError(data.message || "Erreur de génération");
      }
    } catch (e) {
      setError("Erreur de connexion au serveur");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (lastCode) {
      navigator.clipboard.writeText(lastCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paired = esp32s.filter(e => e.paired);
  const unpaired = esp32s.filter(e => !e.paired);

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Appairage ESP32</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Connectez votre bracelet ESP32 à votre compte SafeGuardian
        </p>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(255, 45, 85, 0.1)", border: "1px solid rgba(255, 45, 85, 0.2)", color: "var(--color-danger)", fontSize: "0.85rem", marginBottom: "1.5rem", fontWeight: 500 }}>{error}</div>
      )}
      {success && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(0, 230, 118, 0.15)", border: "1px solid rgba(0, 230, 118, 0.2)", color: "var(--color-success)", fontSize: "0.85rem", marginBottom: "1.5rem", fontWeight: 500 }}>{success}</div>
      )}

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Wifi size={18} style={{ color: "var(--color-primary)" }} />
          Générer un code d'appairage
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
          Générez un code à 8 caractères, puis saisissez-le dans le menu de configuration de votre ESP32.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={generateCode} className="btn btn-primary" disabled={generating} style={{ height: "46px" }}>
            {generating ? "Génération..." : <><RefreshCw size={18} /> Générer un code</>}
          </button>

          {lastCode && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", background: "rgba(0, 217, 255, 0.08)", border: "1px solid rgba(0, 217, 255, 0.2)", borderRadius: "10px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.15em", color: "var(--color-primary)" }}>{lastCode}</span>
              <button onClick={copyCode} style={{ background: "transparent", border: "1px solid var(--border-glass)", borderRadius: "8px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: copied ? "var(--color-success)" : "var(--text-secondary)" }}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          )}
        </div>

        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(0,0,0,0.15)", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
          <h4 style={{ fontSize: "0.9rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Smartphone size={16} style={{ color: "var(--color-warning)" }} />
            Configuration ESP32 requise
          </h4>
          <ol style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 2, paddingLeft: "1.25rem" }}>
            <li>Connectez l'ESP32 au WiFi (SSID/MDP dans le code firmware)</li>
            <li>Générez un code d'appairage depuis cette page</li>
            <li>L'ESP32 enverra une requête POST à <code style={{ color: "var(--color-primary)", background: "rgba(0,0,0,0.3)", padding: "0.125rem 0.375rem", borderRadius: "4px", fontSize: "0.8rem" }}>/api/esp32/pair</code> avec le code</li>
            <li>L'appareil apparaît dans la liste ci-dessous une fois appairé</li>
          </ol>
        </div>
      </div>

      <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
        Appareils ESP32 ({esp32s.length})
      </h3>

      {loading ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>Chargement...</div>
      ) : esp32s.length === 0 ? (
        <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary)" }}>
          <Smartphone size={40} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontWeight: 600 }}>Aucun appareil ESP32</span>
          <span style={{ fontSize: "0.85rem" }}>Générez un code d'appairage pour connecter votre bracelet.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {paired.map(e => (
            <div key={e.id} className="glass-panel" style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: e.active ? "rgba(255, 45, 85, 0.1)" : "rgba(0, 230, 118, 0.1)", border: `1px solid ${e.active ? "rgba(255, 45, 85, 0.2)" : "rgba(0, 230, 118, 0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {e.active ? <AlertTriangle size={20} style={{ color: "var(--color-danger)" }} /> : <Smartphone size={20} style={{ color: "var(--color-success)" }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{e.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{e.id}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <Battery size={14} style={{ color: e.battery > 50 ? "var(--color-success)" : e.battery > 20 ? "var(--color-warning)" : "var(--color-danger)" }} />
                  <span>{e.battery}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <Clock size={14} />
                  <span>{e.lastSeen ? new Date(e.lastSeen).toLocaleTimeString("fr-FR") : "jamais"}</span>
                </div>
                <span className={`badge ${e.active ? "badge-urgent" : "badge-resolved"}`}>
                  {e.active ? "SOS ACTIF" : e.paired ? "Connecté" : "En attente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}