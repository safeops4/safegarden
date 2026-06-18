import React from "react";
import { Battery, BatteryCharging, ShieldAlert, Cpu, RefreshCw, Compass } from "lucide-react";

export default function DeviceStatus({ device }) {
  if (!device) return null;

  const getBatteryColor = (level) => {
    if (level > 50) return "var(--color-success)";
    if (level > 20) return "var(--color-warning)";
    return "var(--color-danger)";
  };

  const getStatusColor = (status) => {
    if (status === "Connecté") return "var(--color-success)";
    if (status && status.includes("ALERTE")) return "var(--color-danger)";
    return "var(--text-muted)";
  };

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Cpu size={18} style={{ color: "var(--color-primary)" }} />
          État du Bracelet
        </h3>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          ID: {device.id}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Status Indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Statut Connexion</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span 
              className="status-dot" 
              style={{
                backgroundColor: getStatusColor(device.status),
                boxShadow: `0 0 10px ${getStatusColor(device.status)}`,
                animation: (device.status && device.status.includes("ALERTE")) ? "pulseActive 1s infinite" : "none"
              }} 
            />
            <span style={{ fontWeight: 700, fontSize: "0.95rem", color: getStatusColor(device.status) }}>
              {device.status}
            </span>
          </div>
        </div>

        {/* Battery Level */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Niveau Batterie</span>
            <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Battery size={16} style={{ color: getBatteryColor(device.battery) }} />
              {device.battery}%
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: "100%",
            height: "8px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid var(--border-glass)"
          }}>
            <div style={{
              width: `${device.battery}%`,
              height: "100%",
              background: getBatteryColor(device.battery),
              borderRadius: "4px",
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>

        {/* GPS Telemetry */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          padding: "0.75rem",
          background: "rgba(0,0,0,0.15)",
          borderRadius: "8px",
          border: "1px solid var(--border-glass)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            <Compass size={14} style={{ color: "var(--color-primary)" }} />
            <span>Coordonnées GPS</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontFamily: "monospace" }}>
            <span>Lat: {device.latitude?.toFixed(4)}</span>
            <span>Lng: {device.longitude?.toFixed(4)}</span>
          </div>
        </div>

        {/* Sync Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          <span>Dernière synchro</span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <RefreshCw size={10} />
            {new Date(device.lastSync).toLocaleTimeString("fr-FR")}
          </span>
        </div>
      </div>
    </div>
  );
}
