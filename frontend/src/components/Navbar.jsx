import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Shield, Radio, LogOut, User } from "lucide-react";

export default function Navbar({ user, onLogout, isApiConnected, alerts = [] }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const activeAlerts = alerts.filter(a => a.status === "URGENT");

  return (
    <nav className="glass-panel" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 2rem",
      borderRadius: "0",
      borderLeft: "none",
      borderRight: "none",
      borderTop: "none",
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "rgba(11, 15, 25, 0.8)",
      backdropFilter: "blur(12px)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Shield size={28} className="pulse-active" style={{ color: "var(--color-primary)" }} />
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "1.25rem",
          letterSpacing: "-0.03em",
          background: "linear-gradient(90deg, #fff, #00d9ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          SafeGuardian CI
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        {/* API Connection Indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.8rem",
          padding: "0.35rem 0.75rem",
          borderRadius: "8px",
          background: isApiConnected ? "rgba(0, 230, 118, 0.08)" : "rgba(255, 45, 85, 0.08)",
          border: `1px solid ${isApiConnected ? "rgba(0, 230, 118, 0.2)" : "rgba(255, 45, 85, 0.2)"}`,
          color: isApiConnected ? "var(--color-success)" : "var(--color-danger)"
        }}>
          <Radio size={14} className={isApiConnected ? "pulse-active" : ""} />
          <span style={{ fontWeight: 600 }}>
            {isApiConnected ? "SERVEUR CONNECTÉ" : "HORS LIGNE"}
          </span>
        </div>

        {/* Notifications Icon & Panel */}
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-glass)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeAlerts.length > 0 ? "var(--color-danger)" : "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
            className={activeAlerts.length > 0 ? "pulse-sos" : ""}
          >
            <Bell size={20} />
            {activeAlerts.length > 0 && (
              <span style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                background: "var(--color-danger)",
                color: "white",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "10px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {activeAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel" style={{
              position: "absolute",
              top: "50px",
              right: 0,
              width: "320px",
              padding: "1rem",
              zIndex: 101,
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              <h4 style={{ marginBottom: "0.75rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
                Alertes Urgentes ({activeAlerts.length})
              </h4>
              {activeAlerts.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", padding: "1rem 0" }}>
                  Aucune alerte active
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {activeAlerts.map(alert => (
                    <div key={alert.id} style={{
                      padding: "0.75rem",
                      borderRadius: "8px",
                      background: "rgba(255, 45, 85, 0.05)",
                      border: "1px solid rgba(255, 45, 85, 0.2)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: "bold", fontSize: "0.85rem", color: "var(--color-danger)" }}>{alert.user}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(alert.date).toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary), #8e2de2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.9rem"
              }}>
                {user.name ? user.name[0].toUpperCase() : <User size={16} />}
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifySelf: "center" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{user.name}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Citoyen</span>
              </div>
            </div>

            <button 
              onClick={onLogout}
              className="btn btn-secondary"
              style={{ padding: "0.5rem 0.8rem", height: "36px", display: "flex", alignItems: "center", gap: "0.25rem" }}
              title="Déconnexion"
            >
              <LogOut size={16} />
              <span style={{ fontSize: "0.8rem" }}>Quitter</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
