import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, User, Mail, Lock, UserPlus, ArrowLeft, Phone } from "lucide-react";

export default function Register({ apiBaseUrl }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, city })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess("Inscription réussie ! Redirection vers la page de connexion...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.message || "Une erreur est survenue lors de l'inscription.");
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
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Inscrivez-vous pour rejoindre le réseau</p>
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

        {success && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: "rgba(0, 230, 118, 0.15)",
            border: "1px solid rgba(0, 230, 118, 0.2)",
            color: "var(--color-success)",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            fontWeight: 500
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-name-input">Nom complet</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <User size={18} />
              </span>
              <input
                id="register-name-input"
                type="text"
                className="form-control"
                placeholder="Jean Kouadio"
                style={{ paddingLeft: "2.75rem" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Phone field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-phone-input">Numéro Téléphone</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Phone size={18} />
              </span>
              <input
                id="register-phone-input"
                type="tel"
                className="form-control"
                placeholder="+225 07 08 09 10 11"
                style={{ paddingLeft: "2.75rem" }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email-input">Adresse Email</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Mail size={18} />
              </span>
              <input
                id="register-email-input"
                type="email"
                className="form-control"
                placeholder="jean.kouadio@exemple.ci"
                style={{ paddingLeft: "2.75rem" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password-input">Mot de passe</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Lock size={18} />
              </span>
              <input
                id="register-password-input"
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

          {/* City field */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-city-input">Ville / Commune</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <User size={18} />
              </span>
              <input
                id="register-city-input"
                type="text"
                className="form-control"
                placeholder="Ex: Abidjan, Yopougon"
                style={{ paddingLeft: "2.75rem" }}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Confirm Password field */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="register-confirm-password-input">Confirmer le mot de passe</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", display: "flex" }}>
                <Lock size={18} />
              </span>
              <input
                id="register-confirm-password-input"
                type="password"
                className="form-control"
                placeholder="••••••••"
                style={{ paddingLeft: "2.75rem" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Création en cours..." : (
              <>
                S'inscrire
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        {/* Link to Login */}
        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Déjà inscrit ?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
