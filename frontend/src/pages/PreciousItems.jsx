import React, { useState, useEffect, useRef } from "react";
import { Diamond, Plus, Trash2, Camera, QrCode, Tag, Clock, Info } from "lucide-react";
import { api } from "../api";

export default function PreciousItems({ apiBaseUrl }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showQr, setShowQr] = useState(null);
  const fileRef = useRef(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api("/precious-items");
      if (response.ok) setItems(await response.json());
    } catch (error) {
      console.error("Failed to fetch precious items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [apiBaseUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const response = await api("/precious-items", {
        method: "POST",
        body: JSON.stringify({ name, description, photo })
      });
      if (response.ok) {
        setName(""); setDescription(""); setPhoto(""); setShowForm(false);
        fetchItems();
      }
    } catch (error) {
      console.error("Failed to create precious item", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet objet ?")) return;
    try {
      const response = await api(`/precious-items/${id}`, { method: "DELETE" });
      if (response.ok) fetchItems();
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Objets Précieux</h1>
          <p style={{ color: "var(--text-secondary)" }}>Enregistrez vos biens de valeur avec photo. En cas de perte, générez un QR code pour faciliter le matching.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary" style={{ height: "46px" }}>
          <Plus size={18} /> Ajouter un bien
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", animation: "fadeIn 0.3s ease" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem" }}>Ajouter un objet de valeur</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nom de l'objet</label>
              <input className="form-control" placeholder="Ex: iPhone 15 Pro, Ordinateur portable..." value={name} onChange={(e) => setName(e.target.value)} required disabled={submitting} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="2" placeholder="Couleur, numéro de série, signes distinctifs..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} style={{ resize: "vertical" }} />
            </div>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Photo (optionnelle)</label>
              <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={handleFileChange} style={{ display: "none" }} />
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                  <Camera size={16} /> Prendre une photo
                </button>
                {photo && <span style={{ color: "var(--color-success)", fontSize: "0.85rem" }}>Photo ajoutée</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={submitting}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Ajout..." : "Ajouter"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
          Mes Biens Enregistrés ({items.length})
        </h3>
        {loading && items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Diamond size={40} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontWeight: 600 }}>Aucun bien enregistré</span>
            <span style={{ fontSize: "0.85rem" }}>Ajoutez vos objets de valeur pour faciliter leur récupération en cas de perte.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {items.map((item) => (
              <div key={item.id} className="glass-panel" style={{ padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                <button onClick={() => handleDelete(item.id)} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", padding: "0.25rem" }}>
                  <Trash2 size={16} />
                </button>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  {item.photo && (
                    <img src={item.photo} alt={item.name} style={{ width: "80px", height: "80px", borderRadius: "10px", objectFit: "cover", border: "1px solid var(--border-glass)" }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Tag size={16} style={{ color: "var(--color-primary)" }} />
                      {item.name}
                    </div>
                    {item.description && <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0.5rem 0" }}>{item.description}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                      <Clock size={14} />
                      {new Date(item.date).toLocaleDateString("fr-FR")}
                      <span className={`badge ${item.status === "En sécurité" ? "badge-resolved" : "badge-warning"}`} style={{ marginLeft: "auto" }}>{item.status}</span>
                    </div>
                    {item.qr_data && (
                      <button onClick={() => setShowQr(showQr === item.id ? null : item.id)} className="btn btn-secondary" style={{ marginTop: "0.75rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem", width: "100%" }}>
                        <QrCode size={14} /> {showQr === item.id ? "Masquer QR Code" : "Afficher QR Code"}
                      </button>
                    )}
                  </div>
                </div>
                {showQr === item.id && item.qr_data && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "white", borderRadius: "10px", textAlign: "center" }}>
                    <div id={`qr-${item.id}`} />
                    <p style={{ color: "#333", fontSize: "0.8rem", wordBreak: "break-all", marginTop: "0.5rem" }}>{item.qr_data}</p>
                    <p style={{ color: "#666", fontSize: "0.75rem" }}>Scannez ce QR code avec l'application SafeGuardian pour déclarer la trouvaille.</p>
                    <button className="btn btn-primary" style={{ marginTop: "0.5rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                      onClick={() => { navigator.clipboard?.writeText(item.qr_data); }}>
                      Copier le QR data
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}