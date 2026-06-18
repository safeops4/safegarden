import React, { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Smartphone, 
  Package, 
  FileText, 
  Activity, 
  CheckCircle,
  HelpCircle,
  MapPin
} from "lucide-react";
import DeviceStatus from "../components/DeviceStatus";
import MapView from "../components/MapView";
import AlertCard from "../components/AlertCard";

export default function Dashboard({ alerts, device, onResolveAlert, onUpdateCoordinates }) {
  const [lostItemsCount, setLostItemsCount] = useState(0);
  const [lostDocsCount, setLostDocsCount] = useState(0);

  // Fetch counts from backend
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const itemsRes = await fetch("http://localhost:5000/api/lost-items");
        if (itemsRes.ok) {
          const items = await itemsRes.json();
          setLostItemsCount(items.length);
        }
        
        const docsRes = await fetch("http://localhost:5000/api/lost-documents");
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setLostDocsCount(docs.length);
        }
      } catch (error) {
        console.error("Error fetching dashboard statistics", error);
      }
    };
    fetchCounts();
  }, []);

  const activeUrgentAlerts = alerts.filter(a => a.status === "URGENT");
  const recentAlerts = alerts.slice(0, 3); // Show top 3 alerts

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Tableau de bord</h1>
        <p style={{ color: "var(--text-secondary)" }}>Aperçu en temps réel de votre bracelet et des alertes de sécurité.</p>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid">
        {/* Active Alerts */}
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

        {/* Device State */}
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

        {/* Lost Objects */}
        <div className="glass-panel stat-card">
          <div className="stat-icon stat-icon-yellow">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{lostItemsCount}</div>
            <div className="stat-label">Objets Déclarés</div>
          </div>
        </div>

        {/* Lost Documents */}
        <div className="glass-panel stat-card">
          <div className="stat-icon stat-icon-cyan">
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{lostDocsCount}</div>
            <div className="stat-label">Documents Déclarés</div>
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
        {/* Map and Device Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Map View */}
          <MapView 
            device={device} 
            activeAlerts={alerts} 
            onMapClick={onUpdateCoordinates}
          />
          
          {/* Detailed Device Status Widget */}
          <DeviceStatus device={device} />
        </div>

        {/* Alerts SOS Feed Section */}
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
    </div>
  );
}
