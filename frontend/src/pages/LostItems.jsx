import React, { useState, useEffect } from "react";
import { Package, Search, Plus, Calendar, Tag, CheckCircle, Info } from "lucide-react";
import { api } from "../api";

export default function LostItems({ apiBaseUrl }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api("/lost-items");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch lost items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const response = await api("/lost-items", {
        method: "POST",
        body: JSON.stringify({ name, description })
      });
      if (response.ok) {
        setName("");
        setDescription("");
        setShowForm(false);
        fetchItems(); // Reload
      }
    } catch (error) {
      console.error("Failed to declare item", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Objets Perdus</h1>
          <p style={{ color: "var(--text-secondary)" }}>Déclarez vos objets perdus ou signalez un objet trouvé dans la commune.</p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
          style={{ height: "46px" }}
        >
          <Plus size={18} />
          Déclarer un objet
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", animation: "fadeIn 0.3s ease" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem" }}>Formulaire de Déclaration</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="item-name">Nom de l'objet</label>
              <input
                id="item-name"
                className="form-control"
                placeholder="Ex: iPhone 13 Pro Max Noir, Trousseau de clés..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="item-desc">Description détaillée</label>
              <textarea
                id="item-desc"
                className="form-control"
                rows="3"
                placeholder="Précisez le lieu approximatif de la perte, la couleur, les signes distinctifs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={submitting}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Déclaration..." : "Déclarer l'objet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items list */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
          Registre des Objets Déclarés ({items.length})
        </h3>

        {loading && items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            Chargement des données...
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Package size={40} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontWeight: 600 }}>Aucun objet déclaré</span>
            <span style={{ fontSize: "0.85rem" }}>Utilisez le bouton ci-dessus pour déclarer un objet perdu ou retrouvé.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nom / Type</th>
                  <th>Description</th>
                  <th>Date Déclaration</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Tag size={16} style={{ color: "var(--color-primary)" }} />
                        {item.name}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)", maxWidth: "350px", fontSize: "0.9rem" }}>{item.description}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <span className={`badge ${item.status === "Retrouvé" ? "badge-resolved" : "badge-warning"}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
