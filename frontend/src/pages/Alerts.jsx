import React, { useState } from "react";
import { AlertTriangle, Plus, ShieldAlert, CheckCircle2, ListFilter } from "lucide-react";
import AlertCard from "../components/AlertCard";
import { api } from "../api";

export default function Alerts({ alerts, onResolveAlert, apiBaseUrl }) {
  const [filter, setFilter] = useState("ALL"); // ALL, URGENT, RESOLVED
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSimulateForm, setShowSimulateForm] = useState(false);

  // Trigger simulated SOS
  const handleTriggerSOS = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await api("/alerts", {
        method: "POST",
        body: JSON.stringify({ message, status: "URGENT" })
      });
      if (response.ok) {
        setMessage("");
        setShowSimulateForm(false);
      }
    } catch (error) {
      console.error("Failed to trigger mock SOS", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "URGENT") return alert.status === "URGENT";
    if (filter === "RESOLVED") return alert.status === "RÉSOLU";
    return true;
  });

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Alertes SOS</h1>
          <p style={{ color: "var(--text-secondary)" }}>Historique et gestion en temps réel des signaux de détresse.</p>
        </div>

        <button 
          onClick={() => setShowSimulateForm(!showSimulateForm)}
          className="btn btn-danger"
          style={{ height: "46px" }}
        >
          <AlertTriangle size={18} />
          Simuler une Alerte SOS
        </button>
      </div>

      {/* Simulated Alert Creation Form */}
      {showSimulateForm && (
        <div className="glass-panel" style={{
          padding: "1.5rem",
          marginBottom: "2rem",
          border: "1px solid rgba(255, 45, 85, 0.3)",
          background: "rgba(255, 45, 85, 0.03)"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger)" }}>
            <ShieldAlert size={18} />
            Déclenchement d'un Signal SOS Virtuel
          </h3>
          <form onSubmit={handleTriggerSOS} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <label className="form-label" htmlFor="sos-msg-input">Message de détresse (Raison de l'alerte)</label>
              <input
                id="sos-msg-input"
                className="form-control"
                placeholder="Ex: Agression physique en cours, accident de la route..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-danger" disabled={loading || !message.trim()}>
                {loading ? "Déclenchement..." : "Lancer SOS"}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSimulateForm(false)}
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border-glass)",
        paddingBottom: "1rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            onClick={() => setFilter("ALL")} 
            className={`btn ${filter === "ALL" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "8px" }}
          >
            Toutes les alertes ({alerts.length})
          </button>
          <button 
            onClick={() => setFilter("URGENT")} 
            className={`btn ${filter === "URGENT" ? "btn-danger" : "btn-secondary"}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "8px" }}
          >
            SOS Actives ({alerts.filter(a => a.status === "URGENT").length})
          </button>
          <button 
            onClick={() => setFilter("RESOLVED")} 
            className={`btn ${filter === "RESOLVED" ? "btn-success" : "btn-secondary"}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "8px" }}
          >
            Résolues ({alerts.filter(a => a.status === "RÉSOLU").length})
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          <ListFilter size={16} />
          <span>Filtre actif: {filter === "ALL" ? "Tous" : filter === "URGENT" ? "SOS" : "Résolus"}</span>
        </div>
      </div>

      {/* Alerts Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {filteredAlerts.length === 0 ? (
          <div className="glass-panel" style={{
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem"
          }}>
            <CheckCircle2 size={48} style={{ color: "var(--color-success)" }} />
            <h3 style={{ margin: 0 }}>Aucune alerte trouvée</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "450px", margin: 0 }}>
              Il n'y a actuellement aucune alerte correspondant à ce filtre. Le réseau citoyen est calme et sécurisé.
            </p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard 
              key={alert.id} 
              alert={alert} 
              onResolve={onResolveAlert}
            />
          ))
        )}
      </div>
    </div>
  );
}
