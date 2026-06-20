import React, { useState, useEffect } from "react";
import { FileText, Plus, FileCheck, CheckCircle2, ShieldCheck, QrCode } from "lucide-react";
import { api } from "../api";

export default function LostDocuments({ apiBaseUrl }) {
  const [documents, setDocuments] = useState([]);
  const [type, setType] = useState("CNI");
  const [ownerName, setOwnerName] = useState("");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await api("/lost-documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch lost documents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [apiBaseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerName.trim() || !number.trim()) return;

    setSubmitting(true);
    try {
      const response = await api("/lost-documents", {
        method: "POST",
        body: JSON.stringify({ type, ownerName, number })
      });
      if (response.ok) {
        setOwnerName("");
        setNumber("");
        setShowForm(false);
        fetchDocuments(); // Reload
      }
    } catch (error) {
      console.error("Failed to declare document", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>Documents Officiels Perdus</h1>
          <p style={{ color: "var(--text-secondary)" }}>Déclarez ou vérifiez les pièces d'identité (CNI, Passeports) perdues/retrouvées.</p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
          style={{ height: "46px" }}
        >
          <Plus size={18} />
          Déclarer un document
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: "1.75rem", marginBottom: "2rem", animation: "fadeIn 0.3s ease" }}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem" }}>Déclaration de document administratif</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="doc-type">Type de document</label>
                <select
                  id="doc-type"
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={submitting}
                >
                  <option value="CNI">Carte Nationale d'Identité (CNI)</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Permis de Conduire">Permis de Conduire</option>
                  <option value="Carte Grise">Carte Grise</option>
                  <option value="Autre">Autre Document</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="doc-owner">Nom complet du titulaire</label>
                <input
                  id="doc-owner"
                  className="form-control"
                  placeholder="Ex: Koffi Kouassi Koffi"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="doc-num">Numéro de la pièce / Référence</label>
                <input
                  id="doc-num"
                  className="form-control"
                  placeholder="Ex: CI01928374"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Déclaration..." : "Déclarer le document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem" }}>
          Base citoyenne des documents déclarés ({documents.length})
        </h3>

        {loading && documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
            Chargement des données...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={40} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontWeight: 600 }}>Aucun document répertorié</span>
            <span style={{ fontSize: "0.85rem" }}>Signalez les pièces administratives perdues ou retrouvées pour aider les citoyens.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Type de Document</th>
                  <th>Nom Titulaire</th>
                  <th>Numéro / Réf</th>
                  <th>Date Signalement</th>
                  <th>État / Statut</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 700, color: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <ShieldCheck size={16} style={{ color: "var(--color-primary)" }} />
                        {doc.type}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{doc.ownerName}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--color-primary)", fontSize: "0.9rem" }}>{doc.number}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {new Date(doc.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td>
                      <span className={`badge ${doc.status === "Vérifié" ? "badge-resolved" : "badge-info"}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      {doc.qr_data && (
                        <button className="btn btn-secondary" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          onClick={() => { navigator.clipboard?.writeText(doc.qr_data); alert("QR Data copié !"); }}>
                          <QrCode size={14} /> QR
                        </button>
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
