import React, { useState, useEffect } from "react";
import { Package, Plus, MapPin, Calendar, Tag, User } from "lucide-react";
import { api } from "../api";

export default function FoundItems({ apiBaseUrl }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [aiMatches, setAiMatches] = useState([]);
  const [aiMatchesLoading, setAiMatchesLoading] = useState(null);

  const fetchAIMatches = async (itemId) => {
    setAiMatchesLoading(itemId);
    try {
      const res = await api(`/ai/match-found-item/${itemId}`);
      if (res.ok) {
        const data = await res.json();
        setAiMatches(prev => ({ ...prev, [itemId]: data }));
      }
    } catch (e) { console.error(e); }
    setAiMatchesLoading(null);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api("/found-items");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch found items", error);
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
      const response = await api("/found-items", {
        method: "POST",
        body: JSON.stringify({ name, description, location })
      });
      if (response.ok) {
        setName("");
        setDescription("");
        setLocation("");
        setShowForm(false);
        fetchItems();
      }
    } catch (error) {
      console.error("Failed to declare found item", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Objets Retrouvés</h1>
          <p style={{ color: "var(--text-secondary)" }}>Déposez ou consultez les objets trouvés dans la commune.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ height: "46px" }}>
          <Plus size={18} />
          Déposer un objet trouvé
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", animation: "fadeIn 0.3s ease" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem" }}>Dépôt d'objet retrouvé</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fi-name">Nom de l'objet</label>
              <input id="fi-name" className="form-control" placeholder="Ex: iPhone 13, Trousseau de clés..." value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="fi-desc">Description</label>
              <textarea id="fi-desc" className="form-control" rows="2" placeholder="Couleur, état, marque..." value={description} onChange={(e) => setDescription(e.target.value)} required disabled={submitting} style={{ resize: "vertical" }} />
            </div>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label" htmlFor="fi-loc">Lieu de dépôt</label>
              <input id="fi-loc" className="form-control" placeholder="Ex: Commissariat de Yopougon, Mairie de Cocody..." value={location} onChange={(e) => setLocation(e.target.value)} disabled={submitting} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Dépôt..." : "Déposer l'objet"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
          Registre des Objets Trouvés ({items.length})
        </h3>
        {loading && items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Package size={40} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontWeight: 600 }}>Aucun objet déposé</span>
            <span style={{ fontSize: "0.85rem" }}>Utilisez le bouton ci-dessus pour déposer un objet retrouvé.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Objet</th>
                  <th>Description</th>
                  <th>Lieu de dépôt</th>
                  <th>Déposé par</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>IA 🔍</th>
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
                    <td style={{ color: "var(--text-secondary)", maxWidth: "250px", fontSize: "0.9rem" }}>{item.description}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <MapPin size={14} style={{ color: "var(--color-primary)" }} />
                        {item.location || "Non précisé"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <User size={14} />
                        {item.declared_by || "Anonyme"}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <span className={`badge ${item.status === "Récupéré" ? "badge-resolved" : "badge-info"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ position: "relative" }}>
                      <button className="btn btn-secondary" style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                        onClick={() => fetchAIMatches(item.id)} disabled={aiMatchesLoading === item.id}>
                        {aiMatchesLoading === item.id ? "..." : "🔍"}
                      </button>
                      {aiMatches[item.id] && aiMatches[item.id].length > 0 && (
                        <div style={{ position: "absolute", background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: "8px", padding: "0.5rem", zIndex: 10, fontSize: "0.75rem", marginTop: "0.25rem", maxWidth: "200px" }}>
                          <div style={{ fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.25rem" }}>Correspondances:</div>
                          {aiMatches[item.id].map((m, i) => (
                            <div key={i} style={{ borderBottom: i < aiMatches[item.id].length - 1 ? "1px solid var(--border-glass)" : "none", padding: "0.25rem 0" }}>
                              {m.name} ({(m.score * 100).toFixed(0)}%)
                            </div>
                          ))}
                        </div>
                      )}
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