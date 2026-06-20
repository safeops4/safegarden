import React from "react";
import { AlertOctagon, CheckCircle, MapPin, Calendar, Check, FileDown, Crosshair } from "lucide-react";
import { api } from "../api";

export default function AlertCard({ alert, onResolve }) {
  const isUrgent = alert.status === "URGENT";
  const dateStr = new Date(alert.date).toLocaleDateString("fr-FR");
  const timeStr = new Date(alert.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const handleExport = async () => {
    try {
      const res = await api(`/alerts/${alert.id}/export`);
      if (res.ok) {
        const dossier = await res.json();
        const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dossier-alerte-${alert.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  return (
    <div 
      className={`glass-panel ${isUrgent ? "pulse-sos" : ""}`}
      style={{
        padding: "1.5rem",
        borderLeft: `5px solid ${isUrgent ? "var(--color-danger)" : "var(--color-success)"}`,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        transition: "all 0.3s ease",
        background: isUrgent ? "rgba(255, 45, 85, 0.05)" : "var(--bg-card)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{alert.user}</span>
            <span className={`badge ${isUrgent ? "badge-urgent" : "badge-resolved"}`}>
              {alert.status}
            </span>
            {alert.escalated && (
              <span className="badge" style={{
                background: "rgba(255, 179, 0, 0.15)",
                color: "var(--color-warning)",
                border: "1px solid rgba(255, 179, 0, 0.3)",
                animation: "pulseActive 1.5s infinite"
              }}>
                ⚠️ ESCALADÉE (3 MIN)
              </span>
            )}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={12} /> {dateStr} à {timeStr}
          </span>
        </div>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isUrgent && onResolve && (
            <button 
              className="btn btn-success"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", height: "36px" }}
              onClick={() => onResolve(alert.id)}
            >
              <Check size={16} />
              Résoudre
            </button>
          )}
          <button 
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", height: "36px" }}
            onClick={handleExport}
          >
            <FileDown size={16} />
            Dossier
          </button>
        </div>
      </div>

      <div style={{
        padding: "0.85rem",
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: "8px",
        fontSize: "0.95rem",
        color: "var(--text-primary)",
        border: "1px solid rgba(255,255,255,0.03)"
      }}>
        {alert.message}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <MapPin size={16} style={{ color: isUrgent ? "var(--color-danger)" : "var(--color-success)" }} />
        <span>{alert.location}</span>
      </div>
    </div>
  );
}
