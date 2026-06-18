import React from "react";
import { Link } from "react-router-dom";
import { Shield, AlertTriangle, Smartphone, FolderSync, Users, ArrowRight } from "lucide-react";

export default function Home({ user }) {
  const features = [
    {
      icon: <Smartphone size={24} style={{ color: "var(--color-primary)" }} />,
      title: "Bracelet IoT Connecté",
      desc: "Liaison directe avec des boutons SOS physiques (ESP32) transmettant en continu batterie, état et coordonnées GPS."
    },
    {
      icon: <AlertTriangle size={24} style={{ color: "var(--color-danger)" }} />,
      title: "Alertes SOS Instantanées",
      desc: "Notification en temps réel de votre cercle de confiance et des secours locaux en cas de danger immédiat."
    },
    {
      icon: <FolderSync size={24} style={{ color: "var(--color-success)" }} />,
      title: "Déclaration d'Objets & Documents",
      desc: "Portail collaboratif citoyen pour déclarer et retrouver vos pièces d'identité (CNI, Passeport) et objets de valeur perdus."
    },
    {
      icon: <Users size={24} style={{ color: "var(--color-warning)" }} />,
      title: "Réseau de Secours",
      desc: "Base de données d'urgence synchronisée avec les services de gendarmerie, police et secours nationaux."
    }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.5rem",
      textAlign: "center",
      maxWidth: "1100px",
      margin: "0 auto"
    }}>
      {/* Header Badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        borderRadius: "9999px",
        background: "rgba(0, 217, 255, 0.08)",
        border: "1px solid rgba(0, 217, 255, 0.2)",
        color: "var(--color-primary)",
        fontSize: "0.85rem",
        fontWeight: "bold",
        marginBottom: "2rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        <Shield size={16} />
        <span>Révolution de la Sécurité Citoyenne - Côte d'Ivoire</span>
      </div>

      {/* Hero Title */}
      <h1 style={{
        fontSize: "calc(2rem + 2.5vw)",
        fontWeight: 800,
        lineHeight: 1.1,
        marginBottom: "1.5rem",
        letterSpacing: "-0.04em",
        fontFamily: "var(--font-display)"
      }}>
        Protégez ce qui compte avec <br />
        <span style={{
          background: "linear-gradient(135deg, #00d9ff 0%, #8e2de2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          SafeGuardian CI
        </span>
      </h1>

      {/* Hero Subtitle */}
      <p style={{
        fontSize: "calc(1rem + 0.3vw)",
        color: "var(--text-secondary)",
        maxWidth: "700px",
        marginBottom: "3rem",
        lineHeight: 1.6
      }}>
        Une plateforme intelligente qui unifie objets connectés IoT, alertes SOS en temps réel et base citoyenne de signalement d'objets perdus.
      </p>

      {/* Call to Actions */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "5rem" }}>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.05rem" }}>
            Accéder au Tableau de Bord
            <ArrowRight size={18} />
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.05rem" }}>
              Se Connecter
              <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1.05rem" }}>
              Créer un Compte
            </Link>
          </>
        )}
      </div>

      {/* Features Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.5rem",
        width: "100%",
        textAlign: "left"
      }}>
        {features.map((feat, index) => (
          <div key={index} className="glass-panel glass-panel-interactive" style={{ padding: "2rem" }}>
            <div style={{ marginBottom: "1.25rem" }}>{feat.icon}</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>{feat.title}</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
