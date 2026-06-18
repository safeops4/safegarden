import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, LogIn, ArrowLeft } from "lucide-react";

export default function Login({ onLogin, apiBaseUrl }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLogin(data.user, data.token);
        navigate("/dashboard");
      } else {
        setError(data.message || "Email ou mot de passe incorrect.");
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de contacter le serveur. Assurez-vous qu'il est en cours d'exécution.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      position: "relative"
    }}>
      {/* Back button */}
      <Link to="/" style={{
        position: "absolute",
        top: "2rem",
        left: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        color: "var(--text-secondary)",
        textDecoration: "none",
        fontSize: "0.9rem",
        fontWeight: 600,
        transition: "color 0.3s"
      }} className="hover-color-white">
        <ArrowLeft size={16} />
        Retour à l'accueil
      </Link>

      <div className="glass-panel" style={{
        width: "100%",
        maxWidth: "420px",
        padding: "2.5rem",
        boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
      }}>
        {/* Brand logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", textAlign: "center" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            background: "rgba(0, 217, 255, 0.1)",
            border: "1px solid rgba(0, 217, 255, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary)"
          }}>
            <Shield size={28} className="pulse-active" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0.5rem 0 0.25rem 0" }}>SafeGuardian CI</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Connectez-vous à la console citoyenne</p>
        </div>

        {error && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "rgba(255, 45, 85, 0.1)",
            border: "1px solid rgba(255, 45, 85, 0.2)",
            color: "var(--color-danger)",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Adresse Email</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Mail size={18} />
              </span>
              <input
                id="email-input"
                type="email"
                className="form-control"
                placeholder="nom@exemple.ci"
                style={{ paddingLeft: "2.75rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="password-input">Mot de passe</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Lock size={18} />
              </span>
              <input
                id="password-input"
                type="password"
                className="form-control"
                placeholder="••••••••"
                style={{ paddingLeft: "2.75rem" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", height: "48px", marginBottom: "1.5rem" }}
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : (
              <>
                Se connecter
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials helper */}
        <div style={{
          padding: "0.75rem",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--border-glass)",
          borderRadius: "8px",
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          <strong>Compte démo :</strong> admin@safeguardian.ci / password
        </div>

        {/* Link to Register */}
        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Nouveau sur la plateforme ?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}
