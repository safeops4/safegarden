import React, { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { 
  AlertTriangle, 
  Smartphone, 
  Package, 
  FileText, 
  Activity, 
  CheckCircle,
  HelpCircle,
  MapPin,
  Diamond,
  Users,
  TrendingUp,
  Clock,
  Brain,
  MessageCircle
} from "lucide-react";
import DeviceStatus from "../components/DeviceStatus";
import MapView from "../components/MapView";
import AlertCard from "../components/AlertCard";

export default function Dashboard({ alerts, device, onResolveAlert, onUpdateCoordinates }) {
  const [lostItemsCount, setLostItemsCount] = useState(0);
  const [lostDocsCount, setLostDocsCount] = useState(0);
  const [foundItemsCount, setFoundItemsCount] = useState(0);
  const [preciousCount, setPreciousCount] = useState(0);
  const [alertPositions, setAlertPositions] = useState([]);
  const [userCount, setUserCount] = useState(1);
  const [anomalies, setAnomalies] = useState([]);

  const fetchAIInsights = async () => {
    try {
      const res = await api("/ai/anomalies");
      if (res.ok) setAnomalies(await res.json());
    } catch (e) { /* ignore */ }
  };

  const fetchCounts = useCallback(async () => {
    try {
      const [items, docs, found, precious] = await Promise.all([
        api("/lost-items"),
        api("/lost-documents"),
        api("/found-items"),
        api("/precious-items")
      ]);
      if (items.ok) setLostItemsCount((await items.json()).length);
      if (docs.ok) setLostDocsCount((await docs.json()).length);
      if (found.ok) setFoundItemsCount((await found.json()).length);
      if (precious.ok) setPreciousCount((await precious.json()).length);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchCounts(); fetchAIInsights(); }, [fetchCounts]);

  // Fetch positions for the most recent active alert
  useEffect(() => {
    const urgent = alerts.filter(a => a.status === "URGENT");
    if (urgent.length === 0) { setAlertPositions([]); return; }
    const latestId = urgent[0].id;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api(`/alerts/${latestId}/positions`);
        if (res.ok && !cancelled) setAlertPositions(await res.json());
      } catch (e) { /* ignore */ }
      if (!cancelled) setTimeout(poll, 5000);
    };
    poll();
    return () => { cancelled = true; };
  }, [alerts]);

  const activeUrgentAlerts = alerts.filter(a => a.status === "URGENT");
  const recentAlerts = alerts.slice(0, 3);
  const resolvedCount = alerts.filter(a => a.status === "RÉSOLU").length;

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Tableau de bord</h1>
        <p style={{ color: "var(--text-secondary)" }}>Aperçu en temps réel de votre bracelet et des alertes de sécurité.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="glass-panel stat-card">
          <div className={`stat-icon ${activeUrgentAlerts.length > 0 ? "stat-icon-red pulse-sos" : "stat-icon-cyan"}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: activeUrgentAlerts.length > 0 ? "var(--color-danger)" : "var(--text-primary)" }}>
              {activeUrgentAlerts.length}
            </div>
            <div className="stat-label">Alertes SOS Actives</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className={`stat-icon ${device?.status === "Connecté" ? "stat-icon-green" : device?.status === "ALERTE SOS" ? "stat-icon-red pulse-active" : "stat-icon-yellow"}`}>
            <Smartphone size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: "1.2rem", color: device?.status === "Connecté" ? "var(--color-success)" : device?.status === "ALERTE SOS" ? "var(--color-danger)" : "var(--color-warning)" }}>
              {device ? `${device.status} (${device.battery}%)` : "Non détecté"}
            </div>
            <div className="stat-label">Bracelet IoT</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon stat-icon-cyan">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-value">{alerts.length}</div>
            <div className="stat-label">Alertes Total ({resolvedCount} résolues)</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon stat-icon-yellow">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{lostItemsCount}</div>
            <div className="stat-label">Objets Perdus</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon stat-icon-cyan">
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{lostDocsCount}</div>
            <div className="stat-label">Documents Perdus</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon stat-icon-green">
            <Diamond size={24} />
          </div>
          <div>
            <div className="stat-value">{preciousCount}</div>
            <div className="stat-label">Objets Précieux</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: "rgba(255, 193, 7, 0.12)" }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{foundItemsCount + foundItemsCount}</div>
            <div className="stat-label">Objets/Docs Trouvés</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "1.5rem",
        alignItems: "start"
      }} className="responsive-dashboard-layout">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <MapView 
            device={device} 
            activeAlerts={alerts} 
            onMapClick={onUpdateCoordinates}
            positions={alertPositions}
          />
          <DeviceStatus device={device} />
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={18} style={{ color: "var(--color-danger)" }} />
            Flux d'alertes SOS
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {recentAlerts.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                color: "var(--text-secondary)"
              }}>
                <CheckCircle size={36} style={{ color: "var(--color-success)" }} />
                <span style={{ fontWeight: 600 }}>Réseau entièrement sécurisé</span>
                <span style={{ fontSize: "0.8rem" }}>Aucun signal SOS d'urgence reçu.</span>
              </div>
            ) : (
              recentAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onResolve={onResolveAlert}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div style={{ marginTop: "1.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Brain size={18} style={{ color: "var(--color-primary)" }} />
            Analyses IA
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {anomalies.length === 0 ? (
              <div style={{ padding: "1rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle size={16} style={{ color: "var(--color-success)" }} />
                Aucune anomalie détectée
              </div>
            ) : (
              anomalies.map((a, i) => (
                <div key={i} style={{
                  flex: "1 1 200px", padding: "0.75rem", borderRadius: "8px",
                  background: a.type === "alert_storm" ? "rgba(255, 45, 85, 0.1)" : "rgba(255, 193, 7, 0.1)",
                  border: `1px solid ${a.type === "alert_storm" ? "rgba(255, 45, 85, 0.2)" : "rgba(255, 193, 7, 0.2)"}`
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem", color: a.type === "alert_storm" ? "var(--color-danger)" : "var(--color-warning)" }}>
                    {a.type === "alert_storm" ? "⚠️ Tempête d'alertes" : "⚠️ Alertes rapides"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{a.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
