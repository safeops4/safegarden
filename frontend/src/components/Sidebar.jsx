import React from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Smartphone, 
  Package, 
  FileText, 
  Users,
  Settings,
  HelpCircle
} from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Tableau de Bord", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Alertes SOS", path: "/alerts", icon: <AlertTriangle size={20} /> },
    { name: "Bracelet Connecté", path: "/device", icon: <Smartphone size={20} /> },
    { name: "Objets Perdus", path: "/lost-items", icon: <Package size={20} /> },
    { name: "Documents Perdus", path: "/lost-documents", icon: <FileText size={20} /> },
    { name: "Contacts Urgence", path: "/contacts", icon: <Users size={20} /> }
  ];

  return (
    <aside className="glass-panel" style={{
      width: "260px",
      minHeight: "100vh",
      borderRadius: "0",
      borderTop: "none",
      borderBottom: "none",
      borderLeft: "none",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 90,
      padding: "6rem 1rem 2rem 1rem", /* Top padding to place under Navbar */
      background: "rgba(16, 22, 38, 0.4)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ padding: "0 0.5rem 1rem 0.5rem", borderBottom: "1px solid var(--border-glass)", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Navigation principale
          </span>
        </div>

        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
              textDecoration: "none",
              color: isActive ? "white" : "var(--text-secondary)",
              background: isActive ? "linear-gradient(135deg, rgba(0, 217, 255, 0.15), rgba(0, 114, 255, 0.05))" : "transparent",
              border: `1px solid ${isActive ? "rgba(0, 217, 255, 0.2)" : "transparent"}`,
              fontWeight: isActive ? 600 : 500,
              fontSize: "0.95rem",
              transition: "all 0.3s ease"
            })}
            className="sidebar-link"
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{
          padding: "1rem",
          borderRadius: "12px",
          background: "rgba(0, 217, 255, 0.03)",
          border: "1px solid rgba(0, 217, 255, 0.08)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)", fontWeight: "bold", marginBottom: "0.25rem" }}>
            <HelpCircle size={14} />
            <span>Assistance CI</span>
          </div>
          Besoin d'aide ? Appelez le 111 (Secours) ou contactez le support technique.
        </div>
      </div>
    </aside>
  );
}
